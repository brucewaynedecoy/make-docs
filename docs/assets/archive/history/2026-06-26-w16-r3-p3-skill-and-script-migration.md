---
date: 2026-06-26
coordinate: W16 R3 P3
closeout: phase
---

# W16 R3 P3 Skill and Script Migration

## Purpose

Record the selected-skill rewrite that routes lifecycle-critical deterministic behavior through packaged `make-docs operations` instead of installed skill-local helper scripts.

## Changes

- Rewrote `closeout-commit`, `closeout-phase`, `work-on-wave`, and `work-on-phase` skill instructions and reference guides to call the packaged CLI operation boundary.
- Removed replaced lifecycle helper scripts from selected-skill registry assets while keeping unrelated guide coverage helpers installed for `closeout-phase`.
- Added retired managed skill asset handling so old installed lifecycle helper scripts are compared against managed source content: unchanged copies are removable and modified local copies are preserved for review.
- Updated selected-skill registry, catalog, install, audit, backup, uninstall, and operation tests for the rewritten skill asset shape.
- Updated PRD 26 source anchors for the Phase 3 implementation and test files.

## Gap Decisions

No new PRD was needed. Q-001, Q-007, and Q-012 remain open because this phase does not decide remote skill delivery, alternate manifests, or shared plugin/skill redirection.

## Guide Decisions

No separate developer or user guide update was needed. The affected user-facing guidance is the selected first-party skill content itself.

## Validation

- `npm test -w packages/cli -- --run tests/install.test.ts tests/audit.test.ts tests/skill-registry.test.ts tests/skill-catalog.test.ts tests/operations.test.ts`
- `npm test -w packages/cli -- --run tests/backup.test.ts tests/uninstall.test.ts`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run build -w packages/cli`
- UAT deferred until the full W16 R3 wave is complete.

## Links

- [historical closeout](2026-06-26-w16-r3-no-scripts-migration-skill-refactor-closeout.md) (retired action-PRD: `docs/prd/26-revise-no-scripts-migration-skill-refactor.md`)
- [W16 R3 Work](../../../work/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-index.md)
