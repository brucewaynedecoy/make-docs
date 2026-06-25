# Delta Backlog and Closeout

## Purpose

Translate the reconciled PRD requirements into a focused backlog that can be implemented without reopening the design decision.

## Backlog Shape

Create [../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-index.md](../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-index.md) with phases for:

1. Requirement and register reconciliation.
2. Reader-facing asset namespace migration.
3. Persona schema and coverage validation.
4. Package, parity, and closeout validation.

The backlog should preserve implementation order:

- PRD/register reconciliation first.
- Template/source-of-truth and path mapping next.
- Code/test validation after canonical paths and persona schema are fixed.
- Package and dogfood proof at closeout.

## Handoff Requirements

The implementation backlog must carry forward:

- The accepted distinction between `.make-docs/**` tool resources and `docs/assets/**` reader-facing assets.
- Template-first authoring and dogfood reseeding from PRD 19.
- W16 `docs/library/playbooks/**` as transitional, not canonical.
- `docs/assets/archive/**` as the managed archive surface after W9 R4; earlier top-level `docs/archive/**` language is superseded.
- `persona` frontmatter as authoritative over directory placement.
- Playbooks as content, not plugins or executors.

## Closeout Expectations

An implementation agent must not mark the work complete until:

- affected links and routers are updated,
- path-hygiene and package-copy surfaces understand the new paths,
- default and custom persona validation exists,
- template/dogfood/package parity proof covers reader-facing assets,
- the risk register entries updated by PRD 22 either close or have narrower follow-up text,
- the generated metadata and configuration overlay follow-on designs can cite a stable persona and path contract.
