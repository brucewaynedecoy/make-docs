# Phase 02: Static Inline Instruction Blocks and Harness Parity

## Purpose

Move make-docs routing into static template-managed instruction blocks and keep
`AGENTS.md` and `CLAUDE.md` mirrored unless route-specific behavior is
explicitly required.

## Overview

Static template instruction files are the complete make-docs routing surface.
Shared instruction files no longer load or point to dedicated
`.make-docs/<harness>.md` instruction files.

## Source PRD Docs

- [historical design](../../designs/2026-06-18-agent-instruction-file-ownership.md) (retired action-PRD: `docs/prd/15-revise-agent-instruction-file-ownership.md`)
- [06-template-contracts-and-generated-assets.md](../../../../prd/06-template-contracts-and-generated-assets.md)

## Stage 1 - Static inline block assets

### Tasks

- [x] t1: Remove dynamic instruction rendering and use static template bytes for selected instruction files.
- [x] t2: Use the same inline managed block body for paired `AGENTS.md` and `CLAUDE.md` files unless route-specific behavior is explicitly required.
- [x] t3: Remove dedicated instruction sources (`.make-docs/AGENTS.md`, `.make-docs/CLAUDE.md`) from the template, asset catalog, manifest, and smoke coverage.
- [x] t4: Add tests that installed instruction files contain managed blocks, paired routers mirror each other, and no router depends on dedicated instruction imports.
- [x] t5: Add migration coverage for clean W17 installs so old dedicated files are removed and old root blocks refresh to the inline routing.

### Acceptance criteria

- Every installed `AGENTS.md` and `CLAUDE.md` contains a valid make-docs marker block.
- Paired `AGENTS.md` and `CLAUDE.md` files contain the same inline block body when no route-specific difference is required.
- Clean W17 dedicated instruction files are removed on reconfigure when their manifest hashes still match.

### Dependencies

- Phase 01 (the block primitive). Authored under `packages/cli/` and `packages/docs/template/` (template-first).

## Closeout notes

- Updated `scripts/check-instruction-routers.sh` so router parity validation no longer allows a dedicated `.make-docs/` instruction-pair exception.
