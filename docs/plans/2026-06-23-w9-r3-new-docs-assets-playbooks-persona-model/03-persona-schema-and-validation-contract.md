# Persona Schema and Validation Contract

## Purpose

Define the persona schema and validation contract required by guide/playbook coverage, generated metadata, and configuration overlays.

## Persona Layers

Personas have two layers:

- Primitive: one of `agent`, `maintainer`, or `user`.
- Persona: a configured audience entry with `slug`, `label`, `description`, and `primitive`.

Default configured personas:

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

Custom personas use the same schema. A custom `slug` must be lowercase kebab-case and unique within the configured persona set. `primitive` must map to one of the three primitives.

## Frontmatter Authority

The canonical machine-readable target for persona-scoped guide and playbook documents is YAML frontmatter:

```yaml
---
persona: developer
---
```

Directory placement is a discovery and publication aid. Validators should report drift when path and frontmatter disagree instead of inferring persona from directory alone.

## Coverage Behavior

Persona-scoped docs are single-primary-persona artifacts in this design. If a completed change affects multiple audiences, coverage should record distinct persona targets and then either:

- update or create one artifact per target,
- record `link-only` for targets served by an existing artifact, or
- record `none` with a reason when no artifact is warranted.

Generated metadata may add relationship fields later, but it must not rename `persona` or make directory placement authoritative unless a later accepted design supersedes PRD 22.

## Configuration Boundary

The later configuration overlay may relabel user-visible presentation vocabulary, but it must preserve these automation-facing names:

- `docs/assets/guides/**`
- `docs/assets/playbooks/**`
- `docs/assets/archive/**`
- `persona`
- `personas`
- `slug`
- `label`
- `description`
- `primitive`
- primitive values `agent`, `maintainer`, `user`

## Validation Requirements

Future implementation must add fixtures that prove:

- default personas validate consistently for guides, playbooks, and coverage records,
- custom personas validate with the same schema,
- invalid slugs and invalid primitives fail,
- `persona` frontmatter is required for persona-scoped guide/playbook docs,
- path/frontmatter drift is reported,
- coverage outputs maintain separate verdict and persona-target axes.
