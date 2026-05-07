# Phase 5: Managed-File Diff Review and Plan Output Cleanup

## Purpose

Capture the completed cleanup that tightened the W14 R2 managed-file conflict behavior after the main model, review flow, and validation phases landed.

## Overview

This phase records the retroactive work that made selected existing managed-file diffs reviewable, blocked unresolved reviewable diffs in non-interactive runs before apply, and cleaned planned operations output so users see grouped operations rather than internal planner labels.

## Source PRD Docs

- [docs/prd/13-revise-cli-conflict-resolution.md](../../prd/13-revise-cli-conflict-resolution.md)
- [docs/prd/05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [docs/prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md)

## Stage 1 - Reviewable Managed-File Diff Cleanup

### Tasks

- [x] t1: Confirm selected existing managed-file diffs are classified as reviewable when they belong to the managed-file conflict flow.
- [x] t2: Distinguish source manifest drift from genuine local edits before surfacing review decisions.
- [x] t3: Preserve unrelated non-reviewable skip behavior outside the managed-file diff review path.

### Acceptance criteria

- Selected existing managed-file diffs are reviewable instead of silently falling outside conflict review.
- Manifest comparison does not misclassify source manifest drift as local modification.
- Unrelated skill-file or audit behavior is not broadened by this cleanup.

### Dependencies

- Phase 2 conflict model and planner work is complete.
- Phase 3 Clack review flow is complete.

## Stage 2 - Non-Interactive Apply Guard

### Tasks

- [x] t4: Fail non-interactive runs with unresolved reviewable managed-file diffs before apply writes output.
- [x] t5: Keep apply deterministic by requiring explicit overwrite or skip resolutions for reviewable diffs.
- [x] t6: Cover unresolved non-interactive diff behavior with focused CLI or install tests.

### Acceptance criteria

- Non-interactive unresolved managed-file diffs fail before apply.
- Failed non-interactive runs do not write partial managed-file output.
- Tests exercise the failure path and the explicit-resolution path.

### Dependencies

- Stage 1 reviewability cleanup is complete.

## Stage 3 - Planned Operations Output Cleanup

### Tasks

- [x] t7: Render planned operations grouped as `generate`, `update`, `skip`, and `remove`.
- [x] t8: Remove parenthetical conflict reasons from user-facing planned operations output.
- [x] t9: Remove internal `skip-conflict` labels from user-facing planned operations output.
- [x] t10: Cover plan output cleanup with focused CLI or renderer tests.

### Acceptance criteria

- Planned operations output groups generated files, updates, skipped files, and removals.
- User-facing plan output does not expose parenthetical planner reasons.
- User-facing plan output does not expose `skip-conflict` labels.
- Output cleanup does not change the underlying `PlannedAction` model semantics.

### Dependencies

- Stage 2 non-interactive guard is complete.

## Stage 4 - Closeout Traceability

### Tasks

- [x] t11: Add this retroactive phase file to the W14 R2 work backlog index.
- [x] t12: Add the matching retroactive plan phase to the W14 R2 plan overview.
- [x] t13: Link the P5 history breadcrumb to the new plan and work artifacts.
- [x] t14: Run scoped docs validation for the new retroactive artifacts.

### Acceptance criteria

- The W14 R2 plan and work indexes include Phase 5.
- The P5 work backlog records completed tasks because implementation and validation already landed.
- The P5 history breadcrumb links to the new plan and work artifacts.
- Scoped validation reports no misspelled conflict-resolution path references.

### Dependencies

- Stages 1 through 3 are complete.
