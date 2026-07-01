# 22 Revise New Docs Assets Playbooks Persona Model

## Purpose

Define the v2 managed project documentation asset model for archive, artifact, history/breadcrumb, library, and playbook surfaces, and define the persona schema that library and playbook coverage can rely on.

## Change Type

- Type: Revision
- Route: `change-plan`
- Coordinate: `W9 R3`
- Source design: [../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md](../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md)
- Plan: [../plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md](../plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md)
- Work backlog: [../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-index.md](../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-index.md)

## Change Notes

This PRD extends PRD 21's `.make-docs/**` tool-resource boundary by assigning `docs/assets/**` to managed project documentation assets. It revises older guide, playbook, archive, artifact, breadcrumb, and docs-assets assumptions without changing source files in this planning round.

W9 R4 narrows that sentence: `docs/assets/**` now owns managed project documentation assets, not only reader-facing assets. Top-level `docs/artifacts/**` is a hard move to `docs/assets/artifacts/**`; top-level `docs/archive/**` is not a shipped v2 target.

W9 R5 supersedes W9 R4 only for the guide/library and history/breadcrumb decisions. The active v2 asset families are `archive`, `artifacts`, `library`, and `playbooks`, with future history/breadcrumb records created on demand under `docs/assets/archive/history/**`. `docs/assets/guides/**`, `docs/assets/breadcrumbs/**`, `docs/assets/history/**`, `docs/guides/**`, and transitional `docs/library/**` are not shipped-current v2 targets.

[23-revise-generated-metadata-lifecycle-handoffs.md](23-revise-generated-metadata-lifecycle-handoffs.md) builds on this PRD by using `persona` as the canonical frontmatter field for generated persona-scoped guides and playbooks. PRD 23 does not rename or reopen the persona schema defined here.

[24-revise-configuration-convention-overlay.md](24-revise-configuration-convention-overlay.md) defines how projects may add or relabel personas. Config may add persona entries or change display labels, but it must preserve `slug`, `label`, `description`, `primitive`, and the canonical primitive values.

[29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md) builds on this PRD by defining the playbook-specific content contract, required `stack` field, body sections, and generic Run Playbook model. It preserves `docs/assets/playbooks/**` and `persona` frontmatter as the reader-facing asset authority.

[31-revise-coverage-pass-extensions-adversarial-review.md](31-revise-coverage-pass-extensions-adversarial-review.md) builds on this PRD by making adversarial-review persona targeting conditional. Adversarial candidates use `persona_target: none` unless the challenge concerns persona-scoped content or audience-specific usability; when they do target an audience, they must use the configured persona slug.

## Requirements

### Managed Project Asset Namespace

### Change Notes

- Superseded by [34-revise-playbook-contract-and-model.md](./34-revise-playbook-contract-and-model.md).

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
        <playbook-slug>.md
```

`docs/assets/archive/**` is managed archive storage. `docs/assets/archive/history/**` is the on-demand home for future history and breadcrumb records, and it is not created in blank installs until the first record is written. `docs/assets/artifacts/**` is optional zero-contract pre-design input material and is not created by default. `docs/assets/library/**` is for explanatory, conceptual, operational, or reference material written for a configured persona. `docs/assets/playbooks/**` is for persona-scoped repeatable process definitions. A playbook is content; it may be consumed by future execution tooling, but storage under `docs/assets/playbooks/**` does not make it a plugin or command.

`docs/assets/**` is not a general dumping ground for make-docs tool resources, runtime state, or generated planning artifacts.

### Current-to-Target Mappings

Future implementation must migrate or classify these surfaces deliberately:

| Current surface | Target surface | Requirement |
| --- | --- | --- |
| `docs/artifacts/**` | `docs/assets/artifacts/**` | Hard move; do not preserve top-level `docs/artifacts/**` as a shipped alias. |
| `docs/assets/guides/**` | `docs/assets/library/**` | Preserve guide intent, router behavior, and persona targeting under the renamed library surface. |
| `docs/guides/**` | `docs/assets/library/**` | Move v1 guide/persona documentation into the managed library surface. |
| `docs/library/playbooks/**` | `docs/assets/playbooks/**` | Treat W16 placement as transitional, migrate now, and preserve lineage. |
| `docs/archive/**` | `docs/assets/archive/**` | Do not ship top-level archive storage; use the managed archive surface under `docs/assets/archive/**`. Existing `docs/assets/archive/**` content remains the current archive namespace. |
| `docs/assets/history/**` | `docs/assets/archive/history/**` | Existing history records are migrated into the archive history surface. |
| `docs/assets/breadcrumbs/**` | `docs/assets/archive/history/**` | W9 R4 breadcrumb records are migrated into archive history; future breadcrumb/history records use this path. |
| `docs/assets/{prompts,references,templates}/**` | `.make-docs/{contracts,references,templates,scripts}/system/**` or a later equivalent | Governed by PRD 21 tool-resource requirements, not by this project-asset model. |

### Persona Schema

Personas have two layers:

- Primitive: one of `agent`, `maintainer`, or `user`.
- Persona: a configured audience entry with `slug`, `label`, `description`, and `primitive`.

The default persona set is:

```yaml
personas:
  - slug: agent
    label: Agent
    description: "Agents executing make-docs workflows, coverage passes, closeout, and lifecycle tasks."
    primitive: agent
  - slug: developer
    label: Developer
    description: "Maintainers, contributors, integrators, operators, validation owners, and extension authors."
    primitive: maintainer
  - slug: user
    label: User
    description: "People using the shipped product, reading task guidance, or adopting a documented workflow."
    primitive: user
```

Custom personas must use the same schema. A custom `slug` must be lowercase kebab-case and unique in the configured persona set. A custom `primitive` must map to `agent`, `maintainer`, or `user`.

Configuration may relabel persona display text, but generated persona frontmatter stores the persona slug, not the label.

### Frontmatter Authority

The canonical machine-readable target for persona-scoped guide and playbook docs is YAML frontmatter field `persona`.

Directory placement is secondary. `docs/assets/library/<persona-slug>/` and `docs/assets/playbooks/<persona-slug>/` are discovery and default publication grouping aids. Validators must report drift when file path and `persona` frontmatter disagree instead of inferring persona from the directory.

Persona-scoped docs are single-primary-persona artifacts. Coverage for multi-audience changes must record separate persona targets and then update/create one artifact per target, record `link-only`, or record `none` with a reason.

### Configuration and Metadata Boundary

The configuration overlay may relabel presentation vocabulary but must not rename the canonical paths, field names, primitive names, or schema keys defined here unless a later accepted design supersedes this PRD.

The generated metadata design may add relationship fields around guide/playbook docs, but it must preserve `persona` as the canonical target field and must not make directory placement authoritative.

### Template, Dogfood, and Package Flow

Future shipped reader-facing guide/playbook defaults must follow PRD 19:

1. Author in `packages/docs/template/docs/**`.
2. Reseed repo-root dogfood `docs/**` for review.
3. Generate `packages/cli/template/**` through copy/prepack behavior.
4. Validate local dev and packed npm behavior.

Implementation must audit and update duplicated path knowledge across CLI source, tests, package docs, routers, path-hygiene checks, and parity checks.

## Non-Requirements

- This PRD does not implement the file migration.
- This PRD does not define plugin behavior. [29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md) defines the generic Run Playbook model.
- This PRD does not make adversarial review a persona-scoped asset by default. [31-revise-coverage-pass-extensions-adversarial-review.md](31-revise-coverage-pass-extensions-adversarial-review.md) owns the optional adversarial-review candidate contract.
- This PRD does not require blank installs to pre-create `docs/assets/archive/history/**`; that directory is on-demand record storage.
- This PRD does not move tool resources back into `docs/assets/**`.
- This PRD does not change the local bootstrap or materialization mode contracts from PRD 17 and PRD 21.

## Affected Baseline Docs

- [02 Architecture Overview](02-architecture-overview.md)
- [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md)
- [05 Installation Profile and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md)
- [06 Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md)
- [09 Dogfood and Maintainer Operations](09-dogfood-and-maintainer-operations.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [14 Add Lifecycle Workflow Foundation](14-add-lifecycle-workflow-foundation.md)
- [19 Revise Template Package Dogfood Source of Truth Contract](19-revise-template-package-dogfood-source-of-truth-contract.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
- [31 Revise Coverage Pass Extensions Adversarial Review](31-revise-coverage-pass-extensions-adversarial-review.md)

## Acceptance Criteria

- The active PRD set makes `docs/assets/library/**` and `docs/assets/playbooks/**` the future reader-facing asset targets.
- The active PRD set records `docs/library/playbooks/**` and `docs/guides/**` as migrated transitional surfaces, `docs/assets/archive/**` as the future archive surface, `docs/assets/artifacts/**` as the optional input surface, and `docs/assets/archive/history/**` as the future history/breadcrumb surface.
- `Q-009` is closed or narrowed by the persona schema in this PRD.
- `R-011`, `R-012`, and `R-013` cite this PRD for the settled persona, playbook/content, and migration target contracts.
- Future implementation backlog tasks include template-first migration, dogfood reseeding, package-copy proof, path-hygiene checks, and persona validation fixtures.

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
- [23 Revise Generated Metadata Lifecycle Handoffs](23-revise-generated-metadata-lifecycle-handoffs.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [31 Revise Coverage Pass Extensions Adversarial Review](31-revise-coverage-pass-extensions-adversarial-review.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
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
