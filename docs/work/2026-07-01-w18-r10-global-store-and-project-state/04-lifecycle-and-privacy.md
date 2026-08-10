---
title: "Phase 4: Lifecycle and Privacy"
kind: "work"
status: "active"
coordinate: "W18 R10 P4"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# Phase 4: Lifecycle and Privacy

## Purpose

Make the store a well-behaved lifecycle citizen: tool uninstall must not orphan it, project removal must prune exactly one project's rows, update must migrate it, and the project paths it records must stay on the machine.

## Overview

Implement the uninstall, setup-remove, and update behaviors for the global store and enforce the local-only privacy rule, inheriting the PRD 32 lifecycle contract unchanged for repo-level backup destinations, legacy root `.backup/**` protection, and agentics pruning.

## Source PRD Docs

- [38 Revise Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [32 Revise Lifecycle Backup State Agentics Pruning](../../prd/38-global-store-and-project-state.md#backup-uninstall-and-upgrade-r-life)
- [05 Installation Profile and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)

## Stage 1 - Uninstall, Setup Remove, and Update

### Tasks

- [x] t1: Implement tool `uninstall` handling for the global store: the store is removed or the user is prompted, it is never silently orphaned, and repository content is never deleted (R-LIFE-1).
- [x] t2: Implement project `setup remove` pruning that deletes only the target project's rows, keyed by the project identifier, leaving every other project's rows untouched (R-LIFE-2).
- [x] t3: Implement pre-v2 configuration detection in `update`, `setup`, and `setup reconfigure` with the warning-and-backup-or-cancel flow defined by the CLI reorganization, and apply any pending store schema migration during `update` (R-LIFE-3).
- [x] t4: Preserve the PRD 32 contract: repo-level backups stay under `.make-docs/backup/**`, legacy root `.backup/**` remains protected, and the agentics pruning rules are unchanged by the store's lifecycle handling.

### Acceptance criteria

- Tool uninstall either removes the store or prompts, never orphans it, and no repository file is deleted by store handling.
- `setup remove` on one project deletes only that project's rows, proven against a store holding rows for multiple projects.
- `update` applies store schema migrations, and the pre-v2 warning-and-backup-or-cancel flow surfaces on `update`, `setup`, and `setup reconfigure`.
- All PRD 32 backup, protection, and pruning behaviors are byte-identical before and after this phase.

### Dependencies

- Phase 1 store and database, Phase 2 identity keying, and Phase 3 row model, so pruning has real rows to scope.

## Stage 2 - Privacy

### Tasks

- [x] t5: Enforce the local-only rule for the store's project-path records: no code path transmits them, and any future export or sharing surface is specified as explicit opt-in (R-PRIV-1).

### Acceptance criteria

- The store's recorded project paths never leave the machine through any current CLI, MCP, or telemetry path, and the opt-in requirement for future export is documented where the store's data handling is described.

### Dependencies

- Stage 1 lifecycle surfaces.
