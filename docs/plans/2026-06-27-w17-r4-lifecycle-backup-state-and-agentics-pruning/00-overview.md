# W17 R4 Lifecycle Backup State and Agentics Pruning

## Purpose

Plan the W17 R4 correction that moves future backup state from root `.backup/**` to `.make-docs/backup/**`, protects existing root `.backup/**` as legacy backup evidence, and makes selected-agentics uninstall prune empty managed `.make-docs/agentics/**` directories safely.

This plan is derived from [Lifecycle Backup State and Agentics Pruning Correction](../../designs/2026-06-27-lifecycle-backup-state-and-agentics-pruning-correction.md). The default lifecycle route is design to plan to PRD to work. This pass proceeds directly through plan, PRD reconciliation, and work-backlog generation because the user explicitly requested the full documentation-generation path in one step.

## Coordinate

- Wave: W17
- Revision: R4
- Route: change-plan
- Source design: [docs/designs/2026-06-27-lifecycle-backup-state-and-agentics-pruning-correction.md](../../designs/2026-06-27-lifecycle-backup-state-and-agentics-pruning-correction.md)
- Current PRD history: [docs/prd/28-shared-agentics-installation-and-harness-exposure.md](../../prd/28-shared-agentics-installation-and-harness-exposure.md#requirement-history)
- Work backlog: [docs/work/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/00-index.md](../../work/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/00-index.md)

## Current Implementation Grounding

- `packages/cli/src/backup.ts` currently plans dated backups under root `.backup/**`.
- `packages/cli/src/audit.ts` currently excludes root `.backup/**` from removal and fallback traversal, but it does not treat `.make-docs/backup/**` as the future backup root.
- `packages/cli/src/uninstall.ts` currently protects paths inside root `.backup/**` and can run backup before deletion from the reviewed audit snapshot.
- `packages/cli/src/skill-catalog.ts` now emits selected-agentics canonical payloads under `.make-docs/agentics/skills/**` plus native harness exposure through symlink-preferred or copy-mirror fallback behavior.
- Existing backup, uninstall, audit, lifecycle, and smoke-pack tests still assert root `.backup/**` as the current destination.

## Plan Shape

1. Reconcile PRD and active backlog authority for the lifecycle-state correction.
2. Change backup destination, audit exclusions, legacy `.backup/**` compatibility, UI text, and package smoke expectations.
3. Add selected-agentics empty-directory pruning for project and home scopes without broadening deletion authority.
4. Validate fresh install, backup, uninstall, selected-skill removal, legacy `.backup/**` preservation, and closeout evidence.

## Non-Goals

- Do not implement automatic root `.backup/**` migration in W17 R4.
- Do not delete root `.backup/**` during uninstall.
- Do not reintroduce generated skill stubs as the default shared-agentics exposure primitive.
- Do not change remote skill delivery, plugin substrate behavior, or MCP write behavior in this correction.
- Do not broaden ownership over arbitrary `.make-docs/**` content.

## Validation Plan

- Run `git diff --check`.
- Run focused CLI tests for backup, uninstall, audit, lifecycle, selected-skill install/remove behavior, and package smoke expectations.
- Run `npm run validate:defaults -w packages/cli`.
- Run `npm run build -w packages/cli`.
- Run `npm run smoke:pack`.
- Run `bash scripts/check-wave-numbering.sh` after work-backlog generation.
- Check touched Markdown local links before commit.

## Intended Follow-On

Implement the paired backlog under [docs/work/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/](../../work/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/).

Downstream lifecycle, selected-agentics cleanup, package-smoke, and plugin lifecycle work should consume W17 R4 before changing backup or uninstall behavior.
