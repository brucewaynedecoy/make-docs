---
title: "Phase 4: First Sync After Adoption"
status: active
---

# Phase 4: First Sync After Adoption

## Purpose

Make the first bare saved-choice setup plan clean after a successful keep adoption.

## Overview

The 2.0.7 release fixed registration. The first sync can still mark kept files modified and find four unreviewed routers. This phase repairs that same W22 R2 promise for a 2.0.8 patch. It revisits adoption after release because the second-machine report exposed a new failure.

## Human Experience Outcome

A maintainer adopts a clone, then runs plain `make-docs setup --dry-run --json`. The CLI shows a clean, unblocked plan. It does not ask the maintainer to choose keep again for unchanged files.

## Source PRD Docs

- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [15 Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [18 Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)

## Stage 1 - Repair Ownership and Surface Parity

### Tasks

- [x] t1: Accept a verified project-owned router or resource hash and matching router receipt or resource projection as clean in compatibility and audit. Keep a later changed hash reviewable.
- [x] t2: Include existing `.make-docs/archive/` and `docs/assets/` root routers for selected harnesses in the adopt plan. Keep the first bare saved-choice sync on the same surfaces.
- [x] t3: Extend the two-Store test with selected harness methods, all four local resource types, changed valid router blocks, and changed resources. Run `--adopt --yes`, then bare `setup --dry-run --json`.
- [x] t7: Prove the published 2.0.7 adopt path against the 2.0.8 candidate. Repair missing archive and assets router proof on the first bare sync without changing tracked files.

### Acceptance criteria

- The adopt and first sync plans name the same selected router and resource paths.
- Kept files have current project-owned hashes and valid router receipts or resource projection records.
- The first bare dry run is unblocked, has no `skip-conflict`, and uses `noop` for every selected file.
- A later edit to a kept file still needs review.
- A checkout adopted with 2.0.7 gets a clean bare 2.0.8 dry run. The next apply adds only the missing Store proof and leaves git clean. Unrelated unrecorded routers still need review.

### Dependencies

- The W22 R2 adoption path and its two-Store fixture exist.

## Stage 2 - Package and Release Check

### Tasks

- [x] t4: Bump the CLI package to `2.0.8` with the supported lockfile process. Build and pack the package.
- [x] t5: Run focused and full checks. Prove Store A and Store B keep the original project ID and leave git clean after adoption and the bare dry run.
- [ ] t6: Record CLI, JSON, manifest, audit, package, and git evidence. Close D-051 after the 2.0.8 candidate also passes release CI and the installed user path can be checked.

### Acceptance criteria

- The packed CLI reports version `2.0.8`.
- A real two-Store clone remains clean in git and keeps its original project ID.
- The packaged first bare saved-choice dry run is clean and unblocked.

### Dependencies

- Stage 1 is complete.
