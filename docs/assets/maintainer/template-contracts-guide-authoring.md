---
title: Guide Contracts and Authoring for make-docs
kind: guide
persona: maintainer
path: template/contracts
status: draft
order: 10
tags:
  - guides
  - contract
  - template
  - authoring
applies-to:
  - docs
  - template
  - guides
related:
  - "template-assets-and-generated-routers.md"
  - "../../prd/06-template-contracts-and-generated-assets.md"
  - "../../../.make-docs/system/contracts/guide-contract.md"
  - "../../../.make-docs/system/templates/guide-maintainer.md"
  - "../../../.make-docs/system/templates/guide-user.md"
  - ../AGENTS.md
---

# Guide Contracts and Authoring for make-docs

> See `.make-docs/system/contracts/guide-contract.md` for the authoritative frontmatter schema and slug rules.

## Overview

This guide is for maintainers who add or update guides under `docs/assets/<persona-slug>/`. The selected Persona determines the audience path; it does not depend on whether the author is human or agent.

Current guide authoring is contract-driven:

- the guide family and publication grouping come from `path`
- the filename slug must mirror that `path`
- every guide starts with YAML frontmatter
- guides are living docs, so filenames do not carry dates

The contract is already shipped through `.make-docs/system/contracts/guide-contract.md`, the guide templates, and the configured `docs/` and `docs/assets/` routers. This guide explains how to apply that current contract when maintaining project guides.

## Guide Taxonomy

Make Docs has two built-in Personas and primitives:

- `user` for people or agents that use the project; default path `docs/assets/user/`
- `maintainer` for people or agents that build, operate, maintain, or extend the project; default path `docs/assets/maintainer/`

Merge valid `.make-docs/config.yaml` entries with both defaults. Custom Personas retain their slug and select one of these primitives. `make-docs project persona list` shows the effective set without Store access. Without the CLI, use the defaults and config rules in the always-present docs router. `agent` is not a primitive; do not infer audience from actor identity.

Use `guide-maintainer.md` for a maintainer-primitive guide or `guide-user.md` for a user-primitive guide. Set `persona` to the selected effective slug. Shared `docs/assets/project/` content is not a Persona guide.

Use the primary audience directory only. If a topic matters to both audiences, keep the full guide in one place and use `related` links instead of duplicating the body.

The `path` field is the publication grouping for a guide, not a filesystem directory. Current path depth is limited to one to three segments:

| Depth | Example | Use |
| --- | --- | --- |
| 1 | `skills` | broad top-level guide family |
| 2 | `template/contracts` | subsystem plus topic |
| 3 | `cli/testing/integration` | rare, narrow sub-topic |

## Required Contract

Every guide must begin with frontmatter containing:

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Display name for the guide |
| `kind` | yes | `guide` |
| `persona` | yes | Effective slug that matches the audience directory |
| `path` | yes | Lowercase publication grouping, one to three segments |
| `status` | yes | `draft`, `published`, or `deprecated` |

Useful optional fields in current maintainer practice:

| Field | When to use it |
| --- | --- |
| `order` | when guides share a path family and need stable sort order |
| `tags` | when search and cross-reference terms add value |
| `applies-to` | when the guide covers specific packages or capability areas |
| `related` | when linking companion guides, templates, or references |

New guides start as `draft`. Do not mark a newly created guide as `published` unless the user explicitly asks for that promotion.

## Filename and Publication Path Rules

Guide filenames are flat files, but they must encode the `path` value:

```text
<path-with-slashes-replaced-by-hyphens>-<descriptive-slug>.md
```

Examples from the current contract:

- `path: template/contracts` becomes `template-contracts-...`
- `path: template/assets` becomes `template-assets-...`
- `path: development/workflows` becomes `development-workflows-...`

That means the filename prefix and the `path` frontmatter must stay synchronized. If you change one without the other, you have created contract drift.

Publication routing is driven by `path`, not by creating nested folders under the persona directories. Keep guide files in the selected `docs/assets/<persona-slug>/` audience path.

## Authoring Workflow

Use this sequence when adding or revising a guide:

1. Read `.make-docs/system/contracts/guide-contract.md`.
2. Choose the effective Persona and use `.make-docs/system/templates/guide-maintainer.md` or `.make-docs/system/templates/guide-user.md` according to its primitive. If the body is absent, use its `make-docs://system/template/<filename>` URI with `make-docs resource read`.
3. Record one verdict (`create`, `update-existing`, `link-only`, or `none`) and a separate Persona target. Choose the audience directory and the final `path` value before writing.
4. Name the file so its prefix exactly matches that `path`.
5. Add `related` links instead of duplicating companion coverage.
6. Keep the body current-state and operational, not historical.

The generated routers reinforce the same workflow:

- `docs/AGENTS.md` sends guide authors to the guide contract and the matching guide template
- the configured `docs/assets/` root instruction files keep guide work in effective Persona paths; no audience child routers are needed

Assets are created on demand. If the assets root is absent, follow the docs router's declared asset router filenames. Do not create empty audience directories. Ordinary content work can continue without optional CLI capture; do not create local operational state, a retry queue, or a false capture claim.

## What Belongs in a Guide

Use guides for durable usage and maintenance knowledge.

Good guide content:

- current workflow rules
- file and path conventions
- maintainer expectations
- links to the reference docs that act as authority

Do not use guides for:

- history records
- design decisions that belong in dated design docs
- generated output templates themselves
- Make Docs operational records, which belong only in the global Make Docs Store through the CLI

History records use `.make-docs/archive/history/` and follow `.make-docs/system/contracts/history-record-contract.md`, not the guide contract.

## Related Resources

- [Template Assets and Generated Routers](template-assets-and-generated-routers.md)
- [Guide Contract](../../../.make-docs/system/contracts/guide-contract.md)
- [Guide Template for Maintainers](../../../.make-docs/system/templates/guide-maintainer.md)
- [Guide Template for Users](../../../.make-docs/system/templates/guide-user.md)
- [Assets Router](../AGENTS.md)
