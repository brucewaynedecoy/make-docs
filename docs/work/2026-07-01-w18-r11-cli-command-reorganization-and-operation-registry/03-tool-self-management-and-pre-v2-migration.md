---
title: "Phase 3: Tool Self-Management and Pre-v2 Migration"
kind: "work"
status: "active"
coordinate: "W18 R11 P3"
source:
  type: "prd"
  path: "docs/prd/39-revise-cli-command-reorganization-and-operation-registry.md"
---

# Phase 3: Tool Self-Management and Pre-v2 Migration

## Purpose

Give the installed tool the self-management commands it lacks, defined honestly around the remote-execution posture where most invocations have no persistent binary, and make the hard cutover safe for existing installs through pre-v2 detection instead of aliases.

## Overview

Implement machine-footprint `uninstall` and detect-and-delegate `update`, and the pre-v2 configuration detection with the warning-and-backup-or-cancel flow on `update`, `setup`, and `setup reconfigure`. The pre-v2 fingerprint set, the warning copy, and the install-manager detection matrix are D9 implementer freedoms.

## Source PRD Docs

- [39 Revise CLI Command Reorganization and Operation Registry](../../prd/39-revise-cli-command-reorganization-and-operation-registry.md)
- [16 Revise Package and Deployment Boundaries](../../prd/16-revise-package-and-deployment-boundaries.md)
- [38 Revise Global Store and Project State](../../prd/38-revise-global-store-and-project-state.md)

## Stage 1 - Machine-Footprint Uninstall and Detect-and-Delegate Update

### Tasks

- [x] t1: Implement top-level `uninstall` as machine-footprint removal: it removes the global store at `~/.make-docs/` and the installed binary when one is present, reports that no binary is installed for a remote-execution user, confirms before removing, and honors the PRD 38 R-LIFE-1 rule of never deleting repository content (R-SELF-1).
- [x] t2: Implement top-level `update` as a detect-and-delegate wrapper over the install manager: it updates a persistent global install where one exists, prints the exact command when detection is ambiguous, reports that there is nothing persistent to update for remote execution, and applies any global-store schema migration per PRD 38 R-DB-2 (R-SELF-2).
- [x] t3: Enforce the no-guessing rule: when the install method or intent is ambiguous, both commands print the exact command and the affected store path rather than executing a destructive global change (R-SELF-3).

### Acceptance criteria

- `uninstall` removes the machine-level footprint only after confirmation, handles the no-binary remote-execution case with an accurate report, and never touches repository content; project removal remains exclusively `setup remove` (hard cutover, R-SELF-1, R-TOP-2).
- `update` delegates to the detected install manager, degrades to printing the exact command on ambiguity, reports nothing-persistent for remote execution, and applies pending store migrations.
- No code path in either command guesses and then executes a destructive global change.

### Dependencies

- Phase 2 command tree reserves the top-level names; the global store's existence, schema versioning, and migration strategy are owned by the W18 R10 lineage and consumed here.

## Stage 2 - Pre-v2 Detection and No-Alias Migration

### Tasks

- [x] t4: Implement pre-v2 configuration detection by fingerprint in `update`, `setup`, and `setup reconfigure`, presenting a warning that itemizes the changes that could break on upgrade followed by a choice between backing up and installing the latest version (recommended) and cancelling (R-MIG-2).
- [x] t5: Complete the no-alias cutover: verify no back-compatibility alias, hidden spelling, or redirect for `operations`, the project-level `uninstall`, or any other removed spelling remains in the parser or help output (R-MIG-1).

### Acceptance criteria

- A pre-v2 install triggers the warning-and-choice flow on `update`, `setup`, and `setup reconfigure`, and cancelling leaves the install untouched (R-TEST-4 seam).
- The parser accepts no removed spelling and ships no aliases; the pre-v2 fingerprint set and warning copy remain implementer-documented choices rather than contract text.

### Dependencies

- Stage 1 self-management commands and the Phase 2 tree.
