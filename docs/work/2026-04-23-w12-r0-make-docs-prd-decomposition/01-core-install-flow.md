# Phase 01: Core Install Flow

## Purpose

This phase rebuilds the stateful installer core that every other `make-docs` subsystem depends on. The foundation starts with the shared typed contracts in `packages/cli/src/types.ts:38-271`, the capability dependency graph in `packages/cli/src/profile.ts:10-99`, and the persisted manifest state in `packages/cli/src/manifest.ts:18-245`.

## Overview

The goal is to preserve the three behaviors the rest of the product assumes are stable: no-command install-or-sync intent routing in `packages/cli/src/cli.ts:77-244`, conflict-safe planning and apply behavior in `packages/cli/src/planner.ts:19-390` and `packages/cli/src/install.ts:26-240`, and conservative lifecycle safety through `packages/cli/src/audit.ts:41-940`. Later phases build on these contracts rather than redefining them.

## Source PRD Docs

- [../../prd/01-product-overview.md](../../prd/01-product-overview.md)
- [../../prd/02-architecture-overview.md](../../prd/02-architecture-overview.md)
- [../../prd/05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [../../prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md)
- [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)
- [../../prd/04-glossary.md](../../prd/04-glossary.md)

## Stage 1 - State and Profile Contracts

### Tasks

- Rebuild `InstallSelections`, `CapabilityState`, `InstallProfile`, `InstallManifest`, and `ApplyResult` from `packages/cli/src/types.ts:38-129` and `packages/cli/src/manifest.ts:79-101`.
- Preserve capability dependency semantics from `CAPABILITY_DEPENDENCIES` in `packages/cli/src/profile.ts:10-15`, including the current selected-but-ineffective behavior produced by `packages/cli/src/profile.ts:42-65`.
- Keep project-versus-home path metadata explicit through `packages/cli/src/manifest.ts:104-183` so later audit, backup, and uninstall flows can distinguish repo files from global skill installs.

### Acceptance criteria

- Legacy manifest migration still handles old instruction-kind installs and optional-skill inference as in `packages/cli/src/manifest.ts:40-76` and `packages/cli/src/manifest.ts:197-219`.
- Identical selections still produce the same `profileId` via `packages/cli/src/profile.ts:74-92`.
- Tests cover both repo-local state and `_home/...` path metadata, not only project-relative files.

### Dependencies

- No earlier phase dependency.

## Stage 2 - Plan and Apply Semantics

### Tasks

- Rebuild desired-asset planning and action classification from `packages/cli/src/planner.ts:19-189` and `packages/cli/src/install.ts:26-163`.
- Preserve instruction-file conflict resolution and managed-file conflict staging from `packages/cli/src/planner.ts:102-139` and `packages/cli/src/install.ts:166-240`.
- Preserve the three install modes encoded in `packages/cli/src/cli.ts:119-244`: first install with no manifest, saved-selection sync when a manifest exists, and explicit reconfigure through the separate command path.

### Acceptance criteria

- Exact content matches still plan as `noop`, and dry-run/apply summaries still align with `packages/cli/src/cli.ts:725-805`.
- Non-interactive `--yes` flows and explicit reconfigure guardrails remain consistent with the current CLI tests around `packages/cli/src/cli.ts:122-137`.
- Managed skill files stay separate from ordinary managed files during apply so later skills-only work can reuse the same manifest safely.

### Dependencies

- Stage 1 - State and Profile Contracts.

## Stage 3 - Audit-Safe Lifecycle Boundaries

### Tasks

- Rebuild `AuditReport` classification for both manifest-present and manifest-missing modes from `packages/cli/src/audit.ts:41-940`.
- Preserve single-snapshot backup and uninstall boundaries from `packages/cli/src/backup.ts:86-307` and `packages/cli/src/uninstall.ts:52-191`.
- Preserve conservative removability rules for root instruction files, global skill paths, conflict staging state, and `.backup/` exclusions.

### Acceptance criteria

- Backup and uninstall both consume one reviewed audit snapshot and do not silently reclassify files after approval.
- Ambiguous paths remain preserved rather than deleted when manifest state or canonical skill content is insufficient, matching `packages/cli/src/audit.ts:432-793`.
- Same-day backup naming and `_home/...` path mapping remain deterministic through `packages/cli/src/backup.ts:160-327`.

### Dependencies

- Stage 2 - Plan and Apply Semantics.
