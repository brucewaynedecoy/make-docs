# Phase 02: Inline Root Block and Harness Parity

## Purpose

Move make-docs's required root routing into the managed block itself and keep
root `AGENTS.md` and `CLAUDE.md` mirrored unless route-specific behavior is
explicitly required.

## Overview

The root managed block is the complete make-docs root routing surface. The
shared root files no longer load or point to dedicated `.make-docs/<harness>.md`
instruction files.

## Source PRD Docs

- [15-revise-agent-instruction-file-ownership.md](../../prd/15-revise-agent-instruction-file-ownership.md)
- [06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md)

## Stage 1 - Inline block render

### Tasks

- [x] t1: Replace the verbatim root-instruction render (`packages/cli/src/renderers.ts`) with block injection using the Phase 01 primitive.
- [x] t2: Render the same inline managed block body for root `AGENTS.md` and `CLAUDE.md`.
- [x] t3: Remove dedicated instruction sources (`.make-docs/AGENTS.md`, `.make-docs/CLAUDE.md`) from the template, asset catalog, renderer, manifest, and smoke coverage.
- [x] t4: Add tests that root files contain exactly one inline make-docs block, mirror each other, and do not depend on dedicated instruction imports.
- [x] t5: Add migration coverage for clean W17 installs so old dedicated files are removed and old root blocks refresh to the inline routing.

### Acceptance criteria

- The root file contains exactly one make-docs marker block and no other make-docs content.
- Root `AGENTS.md` and `CLAUDE.md` contain the same inline block body.
- Clean W17 dedicated instruction files are removed on reconfigure when their manifest hashes still match.

### Dependencies

- Phase 01 (the block primitive). Authored under `packages/cli/` and `packages/docs/template/` (template-first).

## Closeout notes

- Updated `scripts/check-instruction-routers.sh` so router parity validation no longer allows a dedicated `.make-docs/` instruction-pair exception.
