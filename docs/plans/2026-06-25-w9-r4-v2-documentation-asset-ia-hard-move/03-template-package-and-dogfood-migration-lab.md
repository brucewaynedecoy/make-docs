# Template Package and Dogfood Migration Lab

## Purpose

Plan how implementation should keep shipped template behavior, package copies, and this repository's dogfood migration-lab evidence distinct.

## Source-of-Truth Order

1. Shipped defaults start in `packages/docs/template/**`.
2. Repo-root `docs/**` and `.make-docs/**` dogfood selected template-owned behavior.
3. `packages/cli/template/**` is generated through the package copy/prepack path.
4. This repository's unmanaged local material is migration-lab evidence, not shipped source.

## Migration-Lab Requirements

- Use this repo's mixed `docs/` tree to prove migration classification, link repair, backup/uninstall preservation, and idempotent re-run behavior.
- Keep dogfood cleanup scoped to planned surfaces instead of broad opportunistic rewrites.
- Validate packed CLI template behavior separately from local dogfood shape.

## Validation

- Template source and CLI package copies agree after implementation.
- Dogfood changes prove migration behavior without becoming the source of shipped defaults.
- Smoke/package checks cover the new asset IA and the absence of top-level shipped `docs/artifacts/**` and `docs/archive/**` targets.
