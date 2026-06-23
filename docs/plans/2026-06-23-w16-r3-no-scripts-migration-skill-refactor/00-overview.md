# W16 R3 No-Scripts Migration Skill Refactor Plan

## Purpose

Decide how make-docs v2 removes standalone deterministic script dependencies from shipped system resources and first-party skills without breaking installed workflows. The migration target is a CLI/shared-core operation boundary that ordinary CLI commands and future MCP tools can expose consistently, while skills become guidance and routing layers instead of carrying make-docs-owned deterministic logic.

## Source Design

- Design: [No-Scripts Migration and Skill Refactor](../../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md)
- Route: `change-plan`
- Update Mode: `new-doc-related`
- Coordinate: `W16 R3`

## Coordinate Decision

Use `W16 R3`.

The design leaves the coordinate unresolved but names W16 R0 coverage-pass work and `R-014` as prior planning evidence. W16 R0 explicitly deferred `closeout-phase`, `closeout-commit`, `work-on-phase`, and `work-on-wave` skill refactors to the no-scripts / CLI-migration wave. W16 R1 and W16 R2 are already assigned to generated metadata and configuration overlay follow-ups, so this plan continues the W16 lifecycle/skill line as R3 rather than creating a new wave or extending the W10 package/CLI line.

## Current State

- The TypeScript CLI is the current implementation authority for install, reconfigure, selected skills, manifest ownership, audit, backup, uninstall, and package validation.
- The public CLI has no shared operation layer for path hygiene, closeout probing, work-wave resolution, checkpointing, phase gates, markdown cleanup, archive tracing, or decomposition validation.
- `packages/docs/template/.make-docs/scripts/check_path_hygiene.py` and the copied `packages/cli/template/.make-docs/scripts/check_path_hygiene.py` are shipped system helper scripts.
- `packages/cli/skill-registry.json` still installs script assets for first-party skills, including archive, closeout, cleanup, work-on-wave, work-on-phase, and decompose-codebase helpers.
- Current tests and smoke-pack validation assert selected-skill script installation paths.

## Target State

- Core deterministic make-docs behavior is implemented as CLI/shared-core operations with focused tests before first-party helper scripts are removed or downgraded.
- First-party skills become guidance and routing assets. They may cite contracts and call CLI or MCP operations, but they do not own make-docs deterministic behavior.
- System wrapper scripts remain only as thin compatibility wrappers after equivalent CLI/shared-core operations exist.
- The no-default-skills contract remains intact: bare installs still install no skills or skill scripts.
- Old managed scripts, wrapper scripts, modified local files, and custom user scripts are classified through manifest, audit, backup, uninstall, and migration safety rules before mutation.
- Each migrated operation has deterministic inputs, outputs, dry-run behavior, provenance, and error semantics that future MCP tools can expose without a second behavior model.

## PRD Strategy

- Add PRD 26 for the no-scripts migration and first-party skill refactor contract.
- Annotate PRDs 07, 08, 10, 14, 16, 17, 18, 19, 21, 24, and 25 with the new dependency.
- Update the PRD index and risk register, especially D-005, Q-001, Q-007, Q-012, R-002, R-004, R-006, R-008, and R-014.

## Validation Plan

- Run `git diff --check`.
- Run `bash scripts/check-wave-numbering.sh`.
- Attempt to reindex project docs with jdocmunch after edits.
- Scan new and touched docs for unfinished tokens.
- Check touched Markdown local links before committing.

## Intended Follow-On

- Generate the paired implementation backlog under `docs/work/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/`.
- Implement the migration in phases that do not leave any selected first-party skill depending on a missing script or missing CLI replacement.
