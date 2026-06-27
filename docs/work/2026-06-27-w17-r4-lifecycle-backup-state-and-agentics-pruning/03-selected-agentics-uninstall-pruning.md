# P3 Selected-Agentics Uninstall Pruning

## Goal

Prune empty managed `.make-docs/agentics/**` directories after selected-agentics removal without deleting user or ambiguous content.

## Tasks

- [x] t1 Extend audit pruning classification for managed selected-agentics parent directories after audited file removals.
- [x] t2 Cover project-scoped canonical payloads under `.make-docs/agentics/skills/**`.
- [x] t3 Cover home-scoped canonical payloads under the user's `.make-docs/agentics/skills/**`.
- [x] t4 Preserve non-empty, ambiguous, user-authored, modified, wrong-target, plugin, manifest, or future agentics content.
- [x] t5 Ensure symlink exposures are unlinked without following targets and copy mirrors are removed only when managed-clean.
- [x] t6 Add tests for single selected skill removal, multiple selected skill preservation, global selected skill pruning, and unmanaged descendant preservation.
- [x] t7 Update dry-run, audit, backup, and uninstall output only as needed to keep role labels clear.

## Acceptance Criteria

- Removing the only selected skill leaves no empty managed `.make-docs/agentics/**` parent directories.
- Removing one selected skill among siblings keeps the shared parent tree and sibling payload.
- User files under `.make-docs/agentics/**` block pruning and remain visible for review.
- Native harness exposure behavior from W17 R3 remains unchanged.

## Validation Notes

Phase 3 validation confirmed:

- Skills-only selected-skill removal now prunes absolute home-scoped `.make-docs/agentics/**` parents up to, but not beyond, the owning `.make-docs` directory.
- Manifest-owned native exposure symlinks are removed by symlink target metadata, without walking or deleting through the symlink target.
- Absolute home-scope copy-mirror descendant checks normalize against absolute skill paths so clean mirrors can still be recognized without project-relative path drift.
- Audit exposes project selected-agentics parent directories as prunable after managed payload removal, while user-authored descendants under `.make-docs/agentics/**` preserve the containing directory for review.
- Project selected-skill sync removes only the deselected canonical payload and keeps sibling shared payloads and the shared parent tree.
- Full uninstall prunes empty project `.make-docs/agentics/**` parents after the reviewed audit snapshot approves the managed removals.

Coverage decisions:

- Developer guide coverage: none. The change hardens packaged lifecycle behavior and test coverage without introducing a new maintainer workflow.
- User guide coverage: none. Phase 2 already updated the lifecycle user guide for the visible backup-state change; Phase 3 preserves existing selected-agentics user-facing behavior.
- PRD coverage: none. Phase 3 implements the accepted PRD 32 selected-agentics pruning requirements.
- UAT coverage: deferred until the W17 R4 wave is fully implemented, per user instruction.

Validation run:

- `npm test -w packages/cli -- --run tests/install.test.ts tests/audit.test.ts tests/uninstall.test.ts --reporter=dot --silent`
- `npm test -w packages/cli -- --run tests/install.test.ts tests/audit.test.ts tests/uninstall.test.ts tests/lifecycle.test.ts --reporter=dot --silent`
- `git diff --check`
- Focused Markdown link check for the Phase 3 work file and Phase 3 history record.
