# Phase 04: Migration and Dogfood

## Purpose

Migrate existing installs — whose root instruction files are currently verbatim
renders — to the block model without losing content, and migrate make-docs's own
dogfood root files so project-specific maintainer instructions live outside the
block.

## What to build

- A one-time migration in the CLI that converts a verbatim-rendered or clean W17
  root instruction file into the inline block model: extract make-docs's current
  content, refresh it to the current inline block, and preserve any non-make-docs
  content outside the block.
- Dogfood migration: make-docs's own repo-root `AGENTS.md`/`CLAUDE.md` move to
  the inline make-docs block with the template-first maintainer instructions
  placed outside the block; re-seed from `packages/docs/template/**`.
- The lifecycle bullet lives in the inline managed block rather than being a
  stranded local modification or an imported auxiliary file.

## Key decisions

- Migration is non-destructive: content outside make-docs's region is preserved.
- Project-specific dogfood content is relocated outside the block so it persists
  across reconfigure.

## Acceptance criteria

- Existing installs migrate to the block model without losing user content.
- make-docs's repo-root instruction files carry the make-docs block plus
  project-specific instructions outside it, and survive a reconfigure.
- The lifecycle and other routing bullets are delivered via the inline managed block.

## Dependencies

- Phases 01-03. Authored under `packages/cli/`; dogfood re-seed verified with
  `diff -rq` (template-first).
