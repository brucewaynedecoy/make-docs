# Phase 02: Inline Root Block and Harness Parity

## Purpose

Move make-docs's required root routing into the managed block itself and keep
root `AGENTS.md` and `CLAUDE.md` mirrored unless route-specific behavior is
explicitly required.

## What to build

- Replace the verbatim root-instruction render (`renderers.ts:59-61`) with
  block injection: the root file receives one marker block with the required
  make-docs routing inline.
- Render the same block body for root `AGENTS.md` and `CLAUDE.md`.
- Ensure the template and CLI do not ship `.make-docs/AGENTS.md` or
  `.make-docs/CLAUDE.md` as dedicated instruction assets.

## Key decisions

- The root managed block is the complete make-docs root routing surface.
- Block content is mirrored across harnesses by default.
- Auxiliary `.make-docs/<harness>.md` instruction imports are out of scope.

## Acceptance criteria

- The root file contains exactly one make-docs marker block and no other
  make-docs content outside that block.
- Root `AGENTS.md` and `CLAUDE.md` contain the same inline block body.
- Clean W17 dedicated instruction files are removed on reconfigure when their
  manifest hashes still match.

## Dependencies

- Phase 01 (the block primitive). Authored under `packages/cli/` and
  `packages/docs/template/` (template-first).
