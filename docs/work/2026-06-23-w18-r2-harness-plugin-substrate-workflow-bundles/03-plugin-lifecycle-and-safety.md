# P3 Plugin Lifecycle and Safety

## Goal

Implement explicit plugin selection and lifecycle safety for install, update, sync, reconfigure, audit, backup, uninstall, and migration.

## Tasks

- [ ] Add a future-facing plugin selection input path without wiring it to selected-skill flags.
- [ ] Preserve no-default plugin behavior for bare install and default sync.
- [ ] Preserve existing selected plugins during sync and reconfigure unless the user changes the selection or a reviewed migration plan says otherwise.
- [ ] Reconcile selected plugin state against an effective plugin manifest.
- [ ] Classify clean managed payloads, symlink exposures, clean copy mirrors, plugin-specific adapters, modified managed payloads, modified exposures, malformed manifest state, missing-manifest ambiguous state, and user-authored harness plugins.
- [ ] Require review, backup, skip, or manual resolution before mutating ambiguous or modified states.
- [ ] Consume one reviewed audit snapshot before destructive backup/uninstall.
- [ ] Prune empty make-docs-owned plugin directories only when audit proves there are no unmanaged descendants.
- [ ] Apply the W17 R4 lifecycle-state prerequisite before plugin backup, uninstall, migration, or cleanup: new backup writes use `.make-docs/backup/**`, legacy root `.backup/**` is protected, and empty managed `.make-docs/agentics/**` parents are pruned only when safe.
- [ ] Route deterministic plugin actions through CLI/MCP/shared-core operation contracts rather than plugin-owned filesystem logic.

## Acceptance Criteria

- `--selected-skills all` cannot install plugins.
- User-authored harness plugins are preserved even when names match make-docs plugin ids.
- Audit, backup, uninstall, and migration diagnostics report plugin-specific classifications.
- Noninteractive runs fail or skip safely when plugin ownership cannot be proven.

## Validation Notes

Add targeted install, update, audit, backup, uninstall, and migration tests before exposing plugin installation as user-facing behavior.
