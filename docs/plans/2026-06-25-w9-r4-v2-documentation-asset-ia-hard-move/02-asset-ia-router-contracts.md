# Asset IA and Router Contract Plan

## Purpose

Plan the contract and router updates needed to implement the pivot after PRD reconciliation.

## Scope

The implementation work should update future-facing lifecycle, output, router, catalog, compatibility, and path-hygiene surfaces so agents and users see one shipped asset IA.

## Required Contract Targets

- `docs/assets/artifacts/**` replaces top-level `docs/artifacts/**` for optional pre-design input material.
- `docs/assets/archive/**` is the managed archive surface.
- `docs/assets/breadcrumbs/**` replaces future writes to `docs/assets/history/**`; existing history remains historical migration evidence unless intentionally moved or archived.
- `.make-docs/contracts/**`, `.make-docs/references/**`, `.make-docs/scripts/**`, `.make-docs/templates/**`, and `.make-docs/agentics/**` own Make Docs machinery.

## Required Router Behavior

- Generated routers must not keep `docs/artifacts/**` as a supported alias after migration.
- Generated routers must not advertise top-level `docs/archive/**`.
- Current make-docs dogfood routers may be migrated as test inputs, but package/template routers define shipped behavior.

## Validation

- Future-facing router/reference text uses the accepted IA.
- Historical archive/history references are preserved when they are lineage evidence.
- Compatibility/migration behavior explicitly classifies legacy top-level `docs/artifacts/**` as a move, not an alias.
