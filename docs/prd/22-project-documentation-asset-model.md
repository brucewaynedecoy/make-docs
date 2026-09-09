# 22 Project Documentation Asset Model

## Purpose

This document defines the current product contract for managed project documentation assets, their canonical paths, and template-to-package flow. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns managed project documentation assets, their canonical paths, and template-to-package flow. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

### Managed Project Asset Namespace

The canonical information architecture is:

```text
.make-docs/
  system/
    contracts/
    prompts/
    references/
    templates/
  archive/                 # on demand
docs/
  designs/                 # when designs are effective
  plans/                   # when plans are effective
  prd/                     # when PRDs are effective
  work/                    # when work is effective
  assets/                  # on demand
    <configured-harness routers at this root only>
    project/               # only when shared content needs it
    <persona-slug>/         # only when audience content needs it
      testing/             # only when testing content needs it
```

The unconditional configured-harness router foundation is the project root, `docs/`, `.make-docs/`, `.make-docs/system/`, and its four typed system directories. Effective capabilities and their dependencies control routers at `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/`. Fresh setup must not create `docs/assets/` or empty asset children.

`project.surface.ensure assets` creates or safely adopts only the assets root and its selected-harness routers when needed. It creates no `project`, Persona, `testing`, Library, Playbook, archive, or artifact child. Managed assets routers exist only at `docs/assets/`; the root router remains short and links to the canonical resources for detailed rules. On-demand archive creation supplies the archive routers. Ordinary content creation can create its required parent path without the CLI.

Typed system directories contain resource bodies or accepted project overrides only when explicitly selected. Default installation does not eagerly copy the full system-resource body snapshot. `.make-docs/archive/**` is the current lifecycle archive. Make Docs v2 defines no active Library, Playbook, Protocol, or separate artifact target family.

`docs/**` contains project knowledge, not machine operational state. Asset placement does not confer PRD authority. Canonical `NUAT-###` identity and version stay with the owning active PRD. Persona testing packets, executions, findings, dispositions, evidence metadata, and approved evidence stay under `docs/assets/<persona-slug>/testing/**` and bind to that scenario version or digest. Shared inputs and archive paths are not UAT evidence destinations.

### Canonical and Legacy Path Rules

Legacy content receives an exact reviewed disposition:

| Source surface | Reviewed destination or action | Required proof |
| --- | --- | --- |
| `docs/artifacts/**`, `docs/assets/artifacts/**` | `docs/assets/project/**` | Preserve relative content paths and provenance; resolve collisions explicitly. |
| Proved `docs/assets/library/user/**` | `docs/assets/user/**` | Verify audience association and repair active links and metadata. |
| `docs/assets/library/developer/**` proved to use the former shipped default | `docs/assets/maintainer/**` | Prove the shipped-default mapping; a custom `developer` entry is not that proof. |
| Other Library audiences, old guides, `agent` entries, or ambiguous custom values | Explicit reviewed configured-audience or shared-input destination | Resolve intended audience and ownership; never map by slug alone. |
| Retired `docs/assets/playbooks/**` | `.make-docs/archive/legacy-playbooks/**` | Preserve the old relative tree as historical material; never activate or execute it. |
| Proved legacy archive/history/breadcrumb surfaces | `.make-docs/archive/**` | Preserve archive structure and historical provenance after explicit adoption. |
| Old system-resource paths | `.make-docs/system/<type>/**` for proved supported resources | Require explicit disposition for modified, mixed, unknown, or conflicting content. |
| Exact inventoried empty obsolete directories and parents | Empty-safe removal | Recheck each directory; no nonempty parent removal. |
| Legacy Persona testing material | `docs/assets/<persona-slug>/testing/**` | Preserve actual Persona and scenario association; metadata remains authoritative. |

No source-name match alone authorizes a move or deletion. An identical destination still requires byte and provenance verification before duplicate-source cleanup. Different destination bytes block until a reviewed mapping resolves the conflict.

### Template, Dogfood, and Package Flow

Future shipped defaults must follow the upstream-first ownership sequence governed by [06-template-contracts-and-generated-assets.md](./06-template-contracts-and-generated-assets.md), [09-dogfood-and-maintainer-operations.md](./09-dogfood-and-maintainer-operations.md), and [10-packaging-validation-and-release-reference.md](./10-packaging-validation-and-release-reference.md):

1. Author in the applicable `packages/docs/template/.make-docs/**` or `packages/docs/template/docs/**` upstream path.
2. Generate the package projection and verify its allowlist.
3. Reseed only the affected repo-root dogfood paths for review.
4. Validate local development, packed npm behavior, root dogfood parity, and an installed-project fixture in that order.

Implementation must audit and update duplicated path knowledge across CLI source, tests, package docs, routers, path-hygiene checks, and parity checks.

### Persona Grouping Boundary

A resolved Persona slug groups audience assets under `docs/assets/<persona-slug>/**`. It is a discovery path, not a second authority for Persona, scenario, outcome, finding, or evidence. [PRD 47](47-persona-model.md) owns the two primitives, built-in defaults, custom slug resolution, and path/metadata drift. [PRD 23](23-generated-document-metadata-and-lifecycle-handoffs.md) owns document metadata. [PRD 46](46-naive-end-user-acceptance-testing.md) owns UAT semantics and scenario binding.

### Shared Project Inputs and Persona Assets

`docs/assets/project/**` holds shared, non-authoritative source and analysis inputs. `docs/assets/<persona-slug>/**` holds audience assets. Neither placement replaces the owning product requirement or metadata contract. The reserved `project` segment cannot resolve as a Persona.

Before the assets root exists, the always-present `docs/` router states the two default audiences, the shared-input path, the local config location, and a canonical reference pointer. This short guidance works without a CLI. The always-present docs router declares `Asset router files: AGENTS.md, CLAUDE.md` with only the filenames selected for the project's configured harnesses. That declaration is routing guidance, not installed ownership evidence. Without the CLI, authors use it and the short shared asset rules to create exactly those root instruction files. They must not infer harness choice from the execution actor or read raw Store records. A missing or invalid declaration requires an explicit project choice before router creation; ordinary content authoring can continue. With the CLI, the read-only Persona discovery operation shows the same effective entries. Detailed testing, authoring, and migration policy stays in canonical system resources rather than the assets router.

### Reviewed Layout Migration

The permanent layout operations use one content-bound review map and the global Store journal owned by [PRD 38](38-global-store-and-project-state.md). Preview has no writes. Preparation rechecks inventory, config-derived audience mapping, destinations, and link edits before it saves intent. CLI application and manual verification complete only after exact source, destination, byte, and link checks pass. A changed source, new file, unexpected leftover, unsafe path, unknown ownership, or unresolved collision keeps the operation pending or blocks preparation.

Every reviewed entry names its source kind, digest or verified empty-directory observation, provenance, destination, action, and expected result. Historical facts remain unchanged. Mechanical live-link repairs record old and new targets. Archive and backup exclusions must be explicit non-active provenance. CLI failure never creates a project-local migration plan, lock, receipt, or checkpoint. [PRD 39](39-cli-command-model-and-operation-registry.md#persona-and-layout-commands-r-layout) owns the public commands.

## Non-Requirements

- This PRD does not implement the file migration.
- This PRD does not define plugin behavior or create a current Playbook or Protocol product surface.
- This PRD does not make adversarial review a persona-scoped asset by default. [14-lifecycle-workflow-and-coverage-passes.md](14-lifecycle-workflow-and-coverage-passes.md) owns the optional adversarial-review candidate contract.
- This PRD does not require blank installs to pre-create `.make-docs/archive/**`, `docs/assets/project/**`, or Persona testing directories. Those surfaces are on demand, and the always-present `docs/` router supplies discovery before assets exist.
- This PRD does not move tool resources back into `docs/assets/**`.
- This PRD does not redefine system-resource resolution mechanics owned by PRD 17 and PRD 21; it owns the project target paths and placement boundaries only.
## Acceptance Criteria

- The active PRD set makes `.make-docs/system/{contracts,prompts,references,templates}/**`, `.make-docs/archive/**`, `docs/assets/project/**`, and `docs/assets/<persona-slug>/testing/**` the canonical target surfaces. It keeps the configured-harness foundation unconditional, makes the four documentation-capability routers follow the resolved effective profile and its dependencies, creates assets-root routers only on demand, keeps shared and Persona children content-driven, and keeps resource-body projection optional and provenance-aware.
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
- Replacement contract: The target information architecture is `.make-docs/system/{contracts,prompts,references,templates}/**`, `.make-docs/archive/**`, `docs/artifacts/**`, and `docs/assets/<persona-slug>/testing/**`; configured-harness routers and typed directories are always local, resource bodies are machine-served by default with explicit optional projection, and legacy Library, Playbook, Protocol, archive, and guide surfaces are bounded migration inputs whose user-owned contents are preserved.
- Rationale: Recovery requires one product boundary and migration target model that does not mistake historical or project-owned content for current Make Docs authority.
- Source: [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
### 2026-09-02 — W19 R1 P4 Documentation Surface Recovery

- Affected requirement or section: `Managed Project Asset Namespace`, `Non-Requirements`, and `Acceptance Criteria`
- Previous contract: The asset model left `docs/assets/` on demand and did not prohibit managed routers in legacy asset families or Persona subdirectories.
- Replacement contract: `docs/assets/` is an unconditional router root with no managed routers below it. The four documentation-capability routers follow the resolved effective profile and its dependencies. `.make-docs/archive/`, `docs/artifacts/`, and Persona testing remain on demand.
- Rationale: D-030 found that the P4 authority and closeout omitted required documentation surfaces.
- Source: [D-030](./03-open-questions-and-risk-register.md#d-030-w19-r1-documentation-surface-router-topology-was-omitted)

### 2026-09-09 — W19 R4

- Date: 2026-09-09
- Coordinate: W19 R4
- Affected requirement or section: Managed Project Asset Namespace; Canonical and Legacy Path Rules; Persona Grouping Boundary.
- Previous contract: The assets root was unconditional, shared inputs used docs/artifacts, and audience assets outside UAT had no current target family.
- Replacement contract: Assets and its root routers are on demand. Shared inputs use docs/assets/project; audience assets use effective Persona slugs. Exact reviewed migration records byte, link, and historical dispositions.
- Rationale: Remove misleading empty families and make every retained source destination clear.
- Source: [Project Assets and Persona Discovery](../designs/2026-09-09-project-assets-and-persona-discovery.md), [W19 R4 plan](../plans/2026-09-09-w19-r4-project-assets-and-persona-discovery/00-overview.md). Delivery is tracked by the single-phase R4 backlog; runtime implementation has not started.

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
