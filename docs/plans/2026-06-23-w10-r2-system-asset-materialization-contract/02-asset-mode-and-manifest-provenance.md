# Phase 02: Asset Mode and Manifest Provenance

## Purpose

Plan the implementation surface that turns the PRD contract into typed asset materialization behavior and manifest provenance.

## Current Implementation Evidence

- `packages/cli/src/rules.ts` defines static path sets for prompts, templates, references, and required reference surfaces.
- `packages/cli/src/catalog.ts` gathers selected docs assets and reads static template bytes into `ResolvedAsset[]`.
- `packages/cli/src/planner.ts` compares desired assets with on-disk and manifest state before planning writes.
- `packages/cli/src/install.ts` applies planned actions and writes the refreshed manifest.
- `packages/cli/src/manifest.ts` records package metadata, selections, effective capabilities, per-file hashes, source ids, and skill files.

## Required Implementation Decisions

- Add a typed materialization mode model instead of encoding provider behavior as incidental flags.
- Keep `full-snapshot` as the default for normal installs, syncs, reconfigure runs, and packed npm smoke validation.
- Add manifest fields only after a compatibility plan decides schema migration and stale-manifest handling.
- Preserve `.make-docs/` as runtime state; do not move provider state, caches, conflicts, or manifest data into `docs/assets/`.
- Keep local custom overlays and future local config as project-owned state, not provider-resolved system assets.

## Output Dependencies

- This phase depends on the PRD revision from phase 01.
- The later implementation backlog should stage manifest schema work before provider/cache behavior so compatibility and audit surfaces remain reviewable.

## Validation

- Future source work must include `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, and manifest compatibility tests.
- Provider/cache behavior must not be accepted until tests cover provider outage, stale hash, cache miss, and on-demand conflict handling.
