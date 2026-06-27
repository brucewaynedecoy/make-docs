# P3 Selected-Agentics Uninstall Pruning

## Goal

Prune empty managed `.make-docs/agentics/**` directories after selected-agentics removal without deleting user or ambiguous content.

## Tasks

- [ ] t1 Extend audit pruning classification for managed selected-agentics parent directories after audited file removals.
- [ ] t2 Cover project-scoped canonical payloads under `.make-docs/agentics/skills/**`.
- [ ] t3 Cover home-scoped canonical payloads under the user's `.make-docs/agentics/skills/**`.
- [ ] t4 Preserve non-empty, ambiguous, user-authored, modified, wrong-target, plugin, manifest, or future agentics content.
- [ ] t5 Ensure symlink exposures are unlinked without following targets and copy mirrors are removed only when managed-clean.
- [ ] t6 Add tests for single selected skill removal, multiple selected skill preservation, global selected skill pruning, and unmanaged descendant preservation.
- [ ] t7 Update dry-run, audit, backup, and uninstall output only as needed to keep role labels clear.

## Acceptance Criteria

- Removing the only selected skill leaves no empty managed `.make-docs/agentics/**` parent directories.
- Removing one selected skill among siblings keeps the shared parent tree and sibling payload.
- User files under `.make-docs/agentics/**` block pruning and remain visible for review.
- Native harness exposure behavior from W17 R3 remains unchanged.
