# Phase 3: Dogfood Migration and Link Repair

## Purpose

Move this repository's dogfood docs into the W9 R5 asset tree now.

## Overview

This phase moves current local guide, history, breadcrumb, and transitional library files to the corrected paths, then repairs active links and non-historical references.

## Source PRD Docs

- [09 Dogfood and Maintainer Operations](../../prd/09-dogfood-and-maintainer-operations.md)
- [19 Revise Template Package Dogfood Source of Truth Contract](../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md)
- [22 Revise New Docs Assets Playbooks Persona Model](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)

## Stage 1 - Directory Migration

### Tasks

- [x] t1: Move `docs/guides/**` content and `docs/assets/guides/**` routers to `docs/assets/library/**`.
- [x] t2: Move `docs/assets/history/**` and `docs/assets/breadcrumbs/**` records to `docs/assets/archive/history/**`, preserving filenames unless collisions require suffixing newer breadcrumbs.
- [x] t3: Remove transitional `docs/library/**` after preserving unique playbook content under `docs/assets/playbooks/**`.

### Acceptance criteria

- Root dogfood has no `docs/guides`, `docs/library`, `docs/assets/guides`, `docs/assets/breadcrumbs`, or `docs/assets/history` directories.
- Moved files retain their content except for intentional link repair.

### Dependencies

- Phase 2 template path decisions complete.

### Evidence

- Moved guide/persona docs into `docs/assets/library/**`.
- Moved prior history and W9 R4 breadcrumb records into `docs/assets/archive/history/**`.
- Removed the transitional `docs/library/**` tree after confirming the active playbook copy already exists under `docs/assets/playbooks/**`.

## Stage 2 - Link and Reference Repair

### Tasks

- [x] t4: Update active live links to moved files.
- [x] t5: Update future-facing docs references while preserving factual historical references.
- [x] t6: Run targeted local-link checks for moved docs.

### Acceptance criteria

- Links to live moved files resolve from their new locations.
- Old path references remain only in historical or explicitly transitional contexts.

### Dependencies

- Stage 1 complete.

### Evidence

- Repaired moved guide relative links and active references in README, template README, current designs, W9 R4 supersession notes, and guide content.
- Changed-file Markdown link check passed across 142 touched Markdown files, excluding fenced-code examples and archived historical records except the W9 R5 closeout.

## Migration Link-Rewrite Guardrail

This dogfood migration is useful evidence and fixture material, but it is not shipped V2 user migration behavior. Future migration work must use the W9 R5 guide/history/archive moves as examples for packaged CLI/shared-core move planning, deterministic Markdown link rewrites, review routing for modified or user-authored docs, and full destination-tree link validation.

The changed-file link check recorded above is not sufficient for V2 migration acceptance when a whole Markdown tree moves. The acceptance bar is a destination-tree check over every moved Markdown file after the CLI applies, reviews, or blocks the planned rewrite.
