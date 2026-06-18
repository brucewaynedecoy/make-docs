# Phase 02: Dedicated File and Harness-Aware Block

## Purpose

Move the substance of make-docs's routing into a dedicated, fully managed
instruction file, and render only a small harness-aware block into the shared
root file using the Phase 01 primitive.

## Overview

The dedicated file holds nearly all make-docs content (conflict-free); the shared
file's footprint shrinks to a single marker block that loads it, harness-aware so
it degrades gracefully where imports are unavailable.

## Source PRD Docs

- [15-revise-agent-instruction-file-ownership.md](../../prd/15-revise-agent-instruction-file-ownership.md)
- [06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md)

## Stage 1 - Dedicated file and block render

### Tasks

- [x] t1: Add the dedicated managed instruction source per harness (`.make-docs/AGENTS.md`, `.make-docs/CLAUDE.md`) under `packages/docs/template/**` and/or rendered by `packages/cli/src/renderers.ts`, carrying the full make-docs routing.
- [x] t2: Replace the verbatim root-instruction render (`packages/cli/src/renderers.ts:59-61`) with block injection using the Phase 01 primitive.
- [x] t3: Render the harness-aware block body: a Claude Code `@.make-docs/CLAUDE.md` import, or inline essential routing plus a pointer to `.make-docs/AGENTS.md` where import is unavailable.
- [x] t4: Verify per-harness import/auto-load behavior, record the result, and default to the inline-routing fallback where import is unavailable.
- [x] t5: Add tests that the root file contains exactly one make-docs block, the dedicated file is fully managed, and the Claude Code import auto-loads it.

### Acceptance criteria

- The dedicated `.make-docs/<harness>.md` is fully managed and present after install.
- The root file contains exactly one make-docs marker block and no other make-docs content.
- On Claude Code the root block auto-loads the dedicated file; the fallback path inlines the essential routing.
- Per-harness import behavior is verified and documented.

### Dependencies

- Phase 01 (the block primitive). Authored under `packages/cli/` and `packages/docs/template/` (template-first).

## Closeout notes

- Updated `scripts/check-instruction-routers.sh` so router parity validation allows harness-aware root blocks when a sibling `.make-docs/` dedicated instruction pair exists.
