# Phase 2: Shared Audit Engine

> Derives from [Phase 2 of the plan](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/02-shared-audit-engine.md).

## Purpose

Build the shared audit substrate that both `backup` and `uninstall` will consume so ownership, preservation, and prune safety are decided once and executed consistently later.

## Overview

This phase is intentionally about classification, not side effects. It should produce one deterministic audit result that distinguishes removable files, prunable directories, preserved paths, and skipped candidates, with enough context for later backup and uninstall phases to render and execute without re-walking ownership logic.

## Source Plan Phases

- [02-shared-audit-engine.md](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/02-shared-audit-engine.md)

## Stage 1 — Add audit-domain types and manifest helpers

### Tasks

1. Extend `packages/cli/src/types.ts` with audit-domain types for:
   - removable file candidates
   - prunable directory candidates
   - preserved paths
   - skipped candidates
   - audit reasons and audit mode
   - top-level audit result shape
2. Add manifest-to-audit helpers in `packages/cli/src/manifest.ts` so the audit engine can derive:
   - managed file sets
   - `skillFiles`
   - prior selections for instruction-file evaluation
3. Include future-facing fields the later phases need immediately, such as:
   - project-local vs home/global classification
   - backup-relative destination paths
   - deterministic ordering metadata

### Acceptance criteria

- [ ] Audit-domain types exist in `types.ts`
- [ ] Manifest helpers expose managed files, skill files, and prior selections for audit use
- [ ] The audit result shape is rich enough for later backup/uninstall rendering without a second ownership pass
- [ ] Backup-relative destinations are represented for both project-local and home/global paths

### Dependencies

- None

## Stage 2 — Implement manifest-first and fallback auditing

### Tasks

1. Create `packages/cli/src/audit.ts` with one shared audit entrypoint.
2. Implement manifest-present behavior that treats:
   - `manifest.files` as the primary managed file map
   - `manifest.skillFiles` as additional managed candidates
   - `manifest.selections` as the source of prior selection context
3. Implement manifest-missing fallback that inspects only known starter-docs-managed locations and remains conservative in ambiguous cases.
4. Ensure the audit never treats `.backup/` contents as removal candidates.
5. Keep this stage classification-only: no copy or delete behavior.

### Acceptance criteria

- [ ] `packages/cli/src/audit.ts` exists and exports the shared audit entrypoint
- [ ] Manifest-present mode is driven by manifest files, skill files, and selections
- [ ] Manifest-missing mode only inspects expected starter-docs-managed locations
- [ ] `.backup/` contents are excluded from removal consideration
- [ ] The audit performs no mutations

### Dependencies

- Stage 1 type and manifest-helper contract

## Stage 3 — Classify preserved paths and prunable directories safely

### Tasks

1. Implement leaf-first file classification so removable-file decisions happen before directory pruning.
2. Compute directory prune candidates from removable files only.
3. Sort prune candidates deepest-first.
4. Preserve directories that still contain unmanaged or preserved descendants after subtracting removable paths.
5. Carry explicit preservation reasons through the audit output so later CLI messaging can explain why a path remains.

### Acceptance criteria

- [ ] The audit distinguishes removable files, prunable directories, preserved paths, and skipped/already-absent candidates
- [ ] Directory prune candidates are ordered deepest-first
- [ ] Directories containing unmanaged or preserved content are not marked prunable
- [ ] The audit result is deterministic and stable for rendering/tests

### Dependencies

- Stage 2

## Stage 4 — Add exact-content ownership checks for root instruction files

### Tasks

1. Add exact-content checks for project-root `AGENTS.md` and `CLAUDE.md`.
2. In manifest-present mode, regenerate canonical instruction content from prior selections and only mark the file removable on exact match.
3. In manifest-missing mode, use a conservative generated-fingerprint check rather than filename-only ownership.
4. Preserve non-matching root instruction files and record the preservation reason explicitly.

### Acceptance criteria

- [ ] Root `AGENTS.md` and `CLAUDE.md` are removable only on exact canonical or fingerprinted content matches
- [ ] Modified or user-authored root instruction files are preserved
- [ ] Root instruction file preservation reasons are represented in the audit output

### Dependencies

- Stage 2 manifest-aware audit foundation

## Stage 5 — Add focused audit tests

### Tasks

1. Create `packages/cli/tests/audit.test.ts`.
2. Cover manifest-present audit scenarios with managed docs files and skill files.
3. Cover manifest-missing fallback behavior.
4. Cover `.backup/` exclusion.
5. Cover modified vs exact-match root instruction files.
6. Cover directories with unmanaged descendants remaining preserved while removable leaves are still classified.
7. Cover home/global paths mapping to `_home/...` backup-relative destinations.
8. Run targeted audit tests and then the full suite.

### Acceptance criteria

- [ ] `packages/cli/tests/audit.test.ts` exists and covers the shared audit engine directly
- [ ] Manifest-present and manifest-missing audit modes are covered
- [ ] `.backup/` exclusion is covered
- [ ] Root instruction file match/non-match behavior is covered
- [ ] Home/global audit-path handling is covered
- [ ] `npm test -w starter-docs -- tests/audit.test.ts` passes
- [ ] `npm test -w starter-docs` passes

### Dependencies

- Stages 1-4
