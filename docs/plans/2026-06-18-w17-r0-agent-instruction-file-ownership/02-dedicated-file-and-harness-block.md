# Phase 02: Dedicated File and Harness-Aware Block

## Purpose

Move the substance of make-docs's routing into a dedicated, fully managed
instruction file, and render only a small harness-aware block into the shared
root file using the Phase 01 primitive.

## What to build

- A dedicated managed instruction source per harness (working form
  `.make-docs/AGENTS.md`, `.make-docs/CLAUDE.md`) carrying the full make-docs
  routing, authored as a shipped asset under `packages/docs/template/**` and/or
  rendered by `packages/cli/src/renderers.ts`.
- Replace the verbatim root-instruction render (`renderers.ts:59-61`) with
  block injection: the root file receives only the marker block.
- Harness-aware block body: on Claude Code, an import (`@.make-docs/CLAUDE.md`)
  that auto-loads recursively; on a harness without confirmed import support,
  the essential routing inline plus a pointer to `.make-docs/AGENTS.md`.
- Verify the per-harness import/auto-load behavior and record the result; the
  inline-routing fallback is the default where import is unavailable.

## Key decisions

- The dedicated file holds ~all make-docs content (conflict-free); the shared
  file's footprint is minimal.
- Block content is harness-specific; the design degrades gracefully without
  imports.

## Acceptance criteria

- The dedicated `.make-docs/<harness>.md` is fully managed and present after
  install.
- The root file contains exactly one make-docs marker block and no other
  make-docs content.
- On Claude Code, the root `CLAUDE.md` block auto-loads `.make-docs/CLAUDE.md`;
  the fallback path inlines the essential routing.
- Harness import behavior is verified and documented.

## Dependencies

- Phase 01 (the block primitive). Authored under `packages/cli/` and
  `packages/docs/template/` (template-first).
