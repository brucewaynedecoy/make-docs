# Playbook Contract and Metadata

## Objective

Define the concrete v2 content contract for persona-scoped playbooks before implementation touches catalogs, templates, validators, or package sync.

## Path Contract

Canonical v2 playbooks live under:

```text
docs/assets/playbooks/<persona-slug>/<playbook-slug>.md
```

The path identifies the owning persona namespace. Validators must report drift when the path persona and `persona` frontmatter disagree.

## Minimum Frontmatter

Every v2 playbook must include:

```yaml
title: <human-readable title>
kind: playbook
status: proposed | accepted | deprecated
persona: <persona-slug>
stack: build | run
summary: <one-sentence purpose>
```

Additional metadata can be layered later, but generic Run Playbook behavior cannot depend on fields outside this minimum set unless a later accepted design narrows a specific surface.

## Body Contract

The body remains readable documentation and must define:

- purpose and when to use it
- required inputs and authority order
- step-by-step procedure
- gates, stop conditions, or user-decision points
- allowed assists and whether each assist is optional or required
- expected outputs or handoff artifacts
- validation or completion expectations

## Stack Discriminator

`stack: build` governs creating, changing, validating, or releasing documentation system assets.

`stack: run` governs using an installed or already-available documentation workflow to operate on a downstream project.

Selection, validation, and handoff messages must surface the stack when ambiguity exists.

## Acceptance

- Playbook path, metadata, body, and stack rules are specific enough for validators.
- Build-stack and run-stack playbooks cannot silently substitute for each other.
- The current `docs/library/playbooks/**` path remains migration evidence, not the v2 home.
