# 47 Persona Model

## Purpose

This document defines the current persona schema and metadata authority used by persona-scoped Make Docs content. A persona is a documentation audience model, not a testing qualification boundary.

## Scope

This authority owns persona primitives, configured persona entries, persona frontmatter, path/persona drift, and the boundary between configuration and generated metadata. [22 Project Documentation Asset Model](22-project-documentation-asset-model.md) owns the asset paths that may group content by persona slug.

## Component and Capability Map

- Persona primitives classify the broad audience relationship.
- Configured personas provide stable slugs and project-facing labels.
- YAML frontmatter identifies the primary audience of persona-scoped content.
- Validation reports disagreement between path grouping and frontmatter instead of silently inferring authority from the path.

## Requirements

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

The configuration overlay may relabel presentation vocabulary but must not rename the canonical paths, field names, primitive names, or schema keys defined here. Any such change requires authoritative maintenance of this PRD and the applicable asset/configuration owners before implementation.

[23-generated-document-metadata-and-lifecycle-handoffs.md](23-generated-document-metadata-and-lifecycle-handoffs.md) may define additional relationship fields around guide/playbook docs only through authoritative PRD maintenance; `persona` remains the canonical target field and directory placement remains non-authoritative.

### Testing and UAT Boundary

Testing and UAT coverage is not persona-scoped. The qualified naive tester in [46 Naive End-User Acceptance Testing](46-naive-end-user-acceptance-testing.md#r-nuat-scope-qualified-tester-and-installed-product) is a test-isolation boundary, not a persona entry. Persona-aware content may prepare user-facing instructions, but it must not turn testing/UAT coverage into a persona axis or weaken the anti-coaching contract.

## Contracts and Data

Persona entries use `slug`, `label`, `description`, and `primitive`. Persona-scoped guide and playbook documents use the `persona` frontmatter field as machine-readable authority.

## Integrations

- [22 Project Documentation Asset Model](22-project-documentation-asset-model.md) consumes persona slugs for library and playbook grouping.
- [23 Generated Document Metadata and Lifecycle Handoffs](23-generated-document-metadata-and-lifecycle-handoffs.md) preserves `persona` while adding relationship metadata.
- [24 Project Configuration and Convention Overlay](24-project-configuration-and-convention-overlay.md) may add personas or relabel presentation text without changing canonical schema keys or primitive values.
- [46 Naive End-User Acceptance Testing](46-naive-end-user-acceptance-testing.md) owns the non-persona-scoped testing/UAT exception and tester qualification.

## Rebuild Notes

Preserve stable persona slugs, primitive values, frontmatter authority, and drift reporting. Do not infer persona authority from a directory and do not model a naive tester as a configured persona.

## Requirement History

### 2026-08-08 — W9 R3

- Affected requirement or section: `Persona authority`
- Previous contract: Persona requirements were embedded in an editorial PRD that also owned the project documentation asset namespace.
- Replacement contract: Persona schema and metadata authority are owned here; project asset paths remain in PRD 22.
- Rationale: Persona modeling is a coherent capability with a distinct ownership boundary, while active PRDs must be named for product subjects rather than editorial operations.
- Source: [Documentation assets and persona design](../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md)

## Source Anchors

- [Documentation assets and persona design](../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md)
- [Generated metadata design](../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md)
- [Configuration overlay design](../designs/2026-06-20-configuration-and-convention-overlay.md)
- [Project Documentation Asset Model](22-project-documentation-asset-model.md)
- [Naive End-User Acceptance Testing](46-naive-end-user-acceptance-testing.md)
