---
title: Guide Contracts and Authoring for make-docs
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
  - ./template-assets-and-generated-routers.md
  - ../../assets/references/guide-contract.md
  - ../../assets/templates/guide-developer.md
  - ../../assets/templates/guide-user.md
  - ../../guides/AGENTS.md
---

# Guide Contracts and Authoring for make-docs

> See `docs/assets/references/guide-contract.md` for the authoritative frontmatter schema and slug rules.

## Overview

This guide is for maintainers who add or update files under `docs/guides/developer/` and `docs/guides/user/`.

Current guide authoring is contract-driven:

- the guide family and publication grouping come from `path`
- the filename slug must mirror that `path`
- every guide starts with YAML frontmatter
- guides are living docs, so filenames do not carry dates

The contract is already shipped through `docs/assets/references/guide-contract.md`, the guide templates, and the generated `docs/` and `docs/guides/` routers. This guide explains how to apply that current contract when maintaining the guide library.

## Guide Taxonomy

`make-docs` has two guide audiences:

- `docs/guides/user/` for user-facing guidance
- `docs/guides/developer/` for maintainer and contributor guidance

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

Publication routing is driven by `path`, not by creating nested folders under `docs/guides/`. Keep guide files directly in `docs/guides/user/` or `docs/guides/developer/`.

## Authoring Workflow

Use this sequence when adding or revising a guide:

1. Read `docs/assets/references/guide-contract.md`.
2. Start from `docs/assets/templates/guide-developer.md` or `docs/assets/templates/guide-user.md`.
3. Choose the audience directory and the final `path` value first.
4. Name the file so its prefix exactly matches that `path`.
5. Add `related` links instead of duplicating companion coverage.
6. Keep the body current-state and operational, not historical.

The generated routers reinforce the same workflow:

- `docs/AGENTS.md` sends guide authors to the guide contract and the matching guide template
- `docs/guides/AGENTS.md` keeps guide work inside the user or developer guide families

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
- runtime state definitions that belong in `.make-docs/**` or reference docs

History records use `docs/assets/history/` and follow `docs/assets/references/history-record-contract.md`, not the guide contract.

## Related Resources

- [Template Assets and Generated Routers](./template-assets-and-generated-routers.md)
- [Guide Contract](../../assets/references/guide-contract.md)
- [Guide Template for Developers](../../assets/templates/guide-developer.md)
- [Guide Template for Users](../../assets/templates/guide-user.md)
- [Guides Router](../../guides/AGENTS.md)
