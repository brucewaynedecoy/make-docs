# Phase 04: Migration and Dogfood

## Purpose

Migrate existing installs — whose root instruction files are currently verbatim
renders — to the block model without losing content, and migrate make-docs's own
dogfood root files so project-specific maintainer instructions live outside the
block.

## Overview

Migration is non-destructive: content outside make-docs's region is preserved,
and project-specific content is relocated outside the block so it persists across
reconfigure.

## Source PRD Docs

- [15-revise-agent-instruction-file-ownership.md](../../../../prd/15-revise-agent-instruction-file-ownership.md)
- [05-installation-profile-and-manifest-lifecycle.md](../../../../prd/05-installation-profile-and-manifest-lifecycle.md)

## Stage 1 - Install migration

### Tasks

- [x] t1: Implement a one-time migration in the CLI that converts a verbatim-rendered or clean W17 root instruction file into the block model: extract make-docs's current content, refresh it to the inline marker block, and preserve any non-make-docs content outside the block.
- [x] t2: Handle the existing-user-content case (a project's own `AGENTS.md`): preserve it outside the block and insert the make-docs block without overwriting it.

## Stage 2 - Dogfood migration

### Tasks

- [x] t3: Migrate make-docs's own repo-root `AGENTS.md`/`CLAUDE.md` to the inline block model, placing the template-first maintainer instructions outside the block.
- [x] t4: Re-seed the dogfood from `packages/docs/template/**`, verify parity with `diff -rq`, and confirm the lifecycle and other routing bullets now flow from the inline managed block.

### Acceptance criteria

- Existing installs migrate to the block model without losing user content.
- make-docs's repo-root instruction files carry the make-docs block plus project-specific instructions outside it, and survive a reconfigure.
- Template and dogfood are in parity after re-seed.

### Dependencies

- Phases 01-03. Authored under `packages/cli/`; dogfood re-seed verified (template-first).

## Closeout notes

- Updated `scripts/check-instruction-routers.sh` root line budgets so dogfood root instruction files can carry project-specific instructions plus a managed make-docs block.
- Removed dogfood dedicated instruction files at `.make-docs/AGENTS.md` and `.make-docs/CLAUDE.md`.
- Refreshed `.make-docs/manifest.json` so the dogfood install tracks root managed-block hashes without dedicated instruction files.
