# 47 Persona Model

## Purpose

This document defines the current Persona schema, configuration, and metadata semantics used by contracts that explicitly identify a Persona. A Persona is a documentation audience model, not a testing qualification boundary.

## Scope

This authority owns Persona primitives, configured Persona entries, execution eligibility and defaulting, and `persona` frontmatter semantics only where a current contract explicitly defines an artifact as Persona-bearing. [22 Project Documentation Asset Model](22-project-documentation-asset-model.md) treats Library paths as bounded migration inputs and owns the Persona-specific UAT evidence path; directory grouping does not establish Persona authority.

## Component and Capability Map

- Persona primitives classify the broad audience relationship.
- Configured personas provide stable slugs and project-facing labels.
- When a current Persona-bearing contract uses YAML frontmatter, `persona` identifies the configured primary-audience slug.
- Directory placement is non-authoritative; where an applicable contract provides both a Persona-bearing path and `persona` frontmatter, validation reports disagreement instead of inferring or rewriting authority from the path.
- Naive-UAT execution resolves one eligible configured Persona and uses its actual slug for the canonical testing-evidence path.

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

The configured set must retain the canonical `user` slug mapped to the `user` primitive. It is the deterministic no-input Persona for Naive UAT. A configured Persona is eligible for explicit Naive-UAT selection only when its primitive is `user` or `maintainer`; an `agent`-primitive Persona is ineligible even when an agent is the isolated execution actor.

### Frontmatter Authority

The `persona` YAML frontmatter field is canonical only where a current product contract explicitly defines an artifact as Persona-bearing. This PRD defines that field's value as a configured Persona slug; it does not establish a general Persona-scoped document family.

`docs/assets/library/**`, including former `docs/assets/library/<persona-slug>/` publication or grouping, is a bounded migration input under PRD22 rather than a v2 target. Directory placement is never Persona authority. Where an applicable current contract provides both a Persona-bearing path and `persona` frontmatter, validators report drift instead of inferring or rewriting Persona from the directory.

### Configuration and Metadata Boundary

The configuration overlay may relabel presentation vocabulary but must not rename the canonical paths, field names, primitive names, or schema keys defined here. Any such change requires authoritative maintenance of this PRD and the applicable asset/configuration owners before implementation.

[23-generated-document-metadata-and-lifecycle-handoffs.md](23-generated-document-metadata-and-lifecycle-handoffs.md) may define additional relationship fields only where an owning current contract explicitly identifies an artifact as Persona-bearing. Within that contract, `persona` remains the canonical target field and directory placement remains non-authoritative; this boundary must not recreate Library as a managed target.

### Testing and UAT Boundary

Naive-UAT coverage remains a distinct testing decision, but every activated execution resolves exactly one configured Persona. Resolution uses an explicitly supplied Persona whose primitive is `user` or `maintainer`; when none is supplied, it uses the canonical `user` Persona; an unknown, invalid, or `agent`-primitive selection fails closed. The actual selected slug controls `docs/assets/<persona-slug>/testing/**` routing.

The qualified naive tester in [46 Naive End-User Acceptance Testing](46-naive-end-user-acceptance-testing.md#r-nuat-scope-qualified-tester-and-installed-product) remains an independent isolation and evidence boundary, not a Persona entry. Selecting `maintainer` describes the tested audience and does not permit source access, private implementation knowledge, coaching, or any weakening of installed-product and public-information rules.

## Contracts and Data

Persona entries use `slug`, `label`, `description`, and `primitive`. Where an owning current contract explicitly defines an artifact as Persona-bearing, its `persona` frontmatter value must resolve to a configured Persona slug; this does not create a Persona-scoped Library family.

Naive-UAT Persona resolution returns the actual configured slug plus its `user` or `maintainer` primitive, records whether selection was explicit or defaulted, and fails closed for ineligible input. The selected slug is the only valid `<persona-slug>` for `docs/assets/<persona-slug>/testing/**`; those testing assets bind to PRD-owned canonical `NUAT-###` scenarios and do not become persona or scenario authority.

## Integrations

- [22 Project Documentation Asset Model](22-project-documentation-asset-model.md) treats Library paths as bounded migration inputs and owns `docs/assets/<persona-slug>/testing/**` as the project evidence namespace; PRD47 supplies configured-slug semantics without making directory grouping authoritative.
- [23 Generated Document Metadata and Lifecycle Handoffs](23-generated-document-metadata-and-lifecycle-handoffs.md) preserves `persona` only for artifacts whose current owning contract explicitly defines them as Persona-bearing while adding relationship metadata.
- [24 Project Configuration and Convention Overlay](24-project-configuration-and-convention-overlay.md) may add personas or relabel presentation text without changing canonical schema keys or primitive values.
- [46 Naive End-User Acceptance Testing](46-naive-end-user-acceptance-testing.md) owns UAT qualification, scenarios, system-workflow and operation behavior, evidence semantics, findings, and gates while consuming eligible Persona resolution and the canonical `user` default from this PRD.

## Rebuild Notes

Preserve stable Persona slugs, primitive values, and `persona` frontmatter authority only where a current Persona-bearing contract applies. Treat Library paths as migration inputs rather than targets or publication grouping, and never infer Persona authority from a directory. Preserve canonical `user` as the no-input UAT default, accept only configured `user`- or `maintainer`-primitive execution Personas, route evidence by the actual selected slug, and do not model a naive tester as a configured Persona.

## Requirement History

### 2026-08-08 — W9 R3

- Affected requirement or section: `Persona authority`
- Previous contract: Persona requirements were embedded in an editorial PRD that also owned the project documentation asset namespace.
- Replacement contract: Persona schema and metadata authority are owned here; project asset paths remain in PRD 22.
- Rationale: Persona modeling is a coherent capability with a distinct ownership boundary, while active PRDs must be named for product subjects rather than editorial operations.
- Source: [Documentation assets and persona design](../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Persona Schema`, `Frontmatter Authority`, `Configuration and Metadata Boundary`, `Testing and UAT Boundary`, `Contracts and Data`, and `Integrations`
- Previous contract: Testing/UAT was described as non-persona, Persona authority assumed Playbook delivery and persona-scoped Library publication/grouping, and no canonical eligible execution-Persona/default or testing-evidence path contract existed.
- Replacement contract: Every activated Naive-UAT execution resolves one configured `user`- or `maintainer`-primitive Persona, defaults to canonical `user`, fails closed for ineligible input, keeps tester isolation independent, and routes Persona-specific evidence by the actual selected slug under `docs/assets/<persona-slug>/testing/**`; Library paths are migration inputs rather than targets, and `persona` frontmatter is canonical only where a current owning contract explicitly defines a Persona-bearing artifact.
- Rationale: W19 R1 makes PRDs 46 and 47 one acceptance unit so Persona selection cannot diverge from UAT qualification, evidence routing, or anti-coaching, while aligning Persona metadata with PRD22's migration boundary and retiring Playbook and Library delivery assumptions.
- Source: [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

## Source Anchors

- [Documentation assets and persona design](../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md)
- [Generated metadata design](../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md)
- [Configuration overlay design](../designs/2026-06-20-configuration-and-convention-overlay.md)
- [Project Documentation Asset Model](22-project-documentation-asset-model.md)
- [Naive End-User Acceptance Testing](46-naive-end-user-acceptance-testing.md)
- [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
