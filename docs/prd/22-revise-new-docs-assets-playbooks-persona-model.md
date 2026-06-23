# 22 Revise New Docs Assets Playbooks Persona Model

## Purpose

Define the v2 reader-facing documentation asset model for guides and playbooks, decide how that model relates to archive storage, and define the persona schema that guide and playbook coverage can rely on.

## Change Type

- Type: Revision
- Route: `change-plan`
- Coordinate: `W9 R3`
- Source design: [../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md](../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md)
- Plan: [../plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md](../plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md)
- Work backlog: [../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-index.md](../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-index.md)

## Change Notes

This PRD extends PRD 21's `.make-docs/**` tool-resource boundary by assigning `docs/assets/**` to reader-facing reusable documentation assets only. It revises older guide, playbook, archive, and docs-assets assumptions without changing source files in this planning round.

[23-revise-generated-metadata-lifecycle-handoffs.md](23-revise-generated-metadata-lifecycle-handoffs.md) builds on this PRD by using `persona` as the canonical frontmatter field for generated persona-scoped guides and playbooks. PRD 23 does not rename or reopen the persona schema defined here.

[24-revise-configuration-convention-overlay.md](24-revise-configuration-convention-overlay.md) defines how projects may add or relabel personas. Config may add persona entries or change display labels, but it must preserve `slug`, `label`, `description`, `primitive`, and the canonical primitive values.

[29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md) builds on this PRD by defining the playbook-specific content contract, required `stack` field, body sections, and generic Run Playbook model. It preserves `docs/assets/playbooks/**` and `persona` frontmatter as the reader-facing asset authority.

## Requirements

### Reader-Facing Asset Namespace

The canonical v2 reader-facing asset tree is:

```text
docs/
  assets/
    guides/
      AGENTS.md
      <persona-slug>/
        <guide-slug>.md
    playbooks/
      AGENTS.md
      <persona-slug>/
        <playbook-slug>.md
```

`docs/assets/guides/**` is for explanatory, conceptual, operational, or reference material written for a configured persona. `docs/assets/playbooks/**` is for persona-scoped repeatable process definitions. A playbook is content; it may be consumed by future execution tooling, but storage under `docs/assets/playbooks/**` does not make it a plugin or command.

`docs/assets/**` is not a general dumping ground for make-docs tool resources, runtime state, archive storage, or generated planning artifacts.

### Current-to-Target Mappings

Future implementation must migrate or classify these surfaces deliberately:

| Current surface | Target surface | Requirement |
| --- | --- | --- |
| `docs/guides/**` | `docs/assets/guides/**` | Preserve guide intent, router behavior, and persona targeting. |
| `docs/library/playbooks/**` | `docs/assets/playbooks/**` | Treat W16 placement as transitional and preserve lineage. |
| `docs/assets/archive/**` | `docs/archive/**` | Treat archive as lifecycle storage, not reader-facing reusable asset content. |
| `docs/assets/history/**` | follow-on lifecycle storage decision | Do not silently leave history inside reader-facing docs assets as the final state. |
| `docs/assets/{prompts,references,templates}/**` | `.make-docs/{prompts,references,templates}/system/**` or a later equivalent | Governed by PRD 21 tool-resource requirements, not by this reader-facing asset model. |

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

Directory placement is secondary. `docs/assets/guides/<persona-slug>/` and `docs/assets/playbooks/<persona-slug>/` are discovery and default publication grouping aids. Validators must report drift when file path and `persona` frontmatter disagree instead of inferring persona from the directory.

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
- This PRD does not decide final history-record storage.
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

## Acceptance Criteria

- The active PRD set makes `docs/assets/guides/**` and `docs/assets/playbooks/**` the future reader-facing asset targets.
- The active PRD set records `docs/library/playbooks/**` as transitional and `docs/archive/**` as the future archive surface.
- `Q-009` is closed or narrowed by the persona schema in this PRD.
- `R-011`, `R-012`, and `R-013` cite this PRD for the settled persona, playbook/content, and migration target contracts.
- Future implementation backlog tasks include template-first migration, dogfood reseeding, package-copy proof, path-hygiene checks, and persona validation fixtures.

## Source Anchors

- [../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md](../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md)
- [../plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md](../plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md)
- [../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-index.md](../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-index.md)
- [23 Revise Generated Metadata Lifecycle Handoffs](23-revise-generated-metadata-lifecycle-handoffs.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
- [../designs/2026-06-20-playbook-contract-and-run-playbook.md](../designs/2026-06-20-playbook-contract-and-run-playbook.md)
- [../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md](../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md)
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
