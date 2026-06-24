# Phase 02: Static Inline Instruction Blocks and Harness Parity

## Purpose

Move make-docs routing into static template-managed instruction blocks and keep
`AGENTS.md` and `CLAUDE.md` mirrored unless route-specific behavior is
explicitly required.

## What to build

- Remove dynamic instruction rendering: selected instruction files are copied
  from `packages/docs/template/` and reconciled by managed block.
- Use the same managed-block body for paired `AGENTS.md` and `CLAUDE.md` files
  unless a future route-specific requirement explicitly differs.
- Ensure the template and CLI do not ship `.make-docs/AGENTS.md` or
  `.make-docs/CLAUDE.md` as dedicated instruction assets.

## Key decisions

- Static template files are the complete make-docs routing surface.
- Block content is mirrored across harnesses by default.
- Auxiliary `.make-docs/<harness>.md` instruction imports are out of scope.

## Acceptance criteria

- Every installed `AGENTS.md` and `CLAUDE.md` contains a valid make-docs marker
  block.
- Paired `AGENTS.md` and `CLAUDE.md` files contain the same inline block body
  when no route-specific difference is required.
- Clean W17 dedicated instruction files are removed on reconfigure when their
  manifest hashes still match.

## Dependencies

- Phase 01 (the block primitive). Authored under `packages/cli/` and
  `packages/docs/template/` (template-first).
