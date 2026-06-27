# 32 Revise Lifecycle Backup State and Agentics Pruning

## Purpose

Revise lifecycle backup and uninstall behavior so Make Docs-owned backup state lives under `.make-docs/backup/**`, existing root `.backup/**` remains protected legacy backup state, and selected-agentics cleanup removes empty managed `.make-docs/agentics/**` directories only when safe.

## Change Type

Revision. This PRD extends the active lifecycle, compatibility, package, tool-directory, shared-agentics, and plugin-substrate requirements.

Route: `change-plan`

Coordinate: `W17 R4`

## Change Notes

W7 established root `.backup/**` as the backup destination. W9 R2 made `.make-docs/**` the tool-directory home for Make Docs-owned runtime state. W17 R3 made `.make-docs/agentics/**` the canonical selected-agentics payload store with native harness exposure. W17 R4 reconciles those decisions by moving future backup state into `.make-docs/backup/**` and tightening selected-agentics uninstall pruning.

This PRD does not require automatic migration of existing root `.backup/**`. Existing root backup trees are protected legacy state and may be migrated only by a later explicit reviewed migration.

## Requirements

### Backup Destination

New backup writes must target `.make-docs/backup/<date>`.

Same-day ordinal behavior must remain deterministic under `.make-docs/backup/**`: the first backup for a date uses the plain date directory, and later same-day backups use zero-padded ordinals.

Home-scoped managed files continue to be copied under `_home/**` inside the dated backup snapshot.

Lifecycle UI, CLI diagnostics, tests, and smoke-pack validation must teach `.make-docs/backup/**` as the future backup destination.

### Legacy Root Backup Compatibility

Existing root `.backup/**` is protected legacy backup state.

The CLI must not create new root `.backup/**` snapshots after W17 R4.

The CLI must not use root `.backup/**` when calculating new `.make-docs/backup/**` ordinals.

Audit, backup, uninstall, fallback recognition, and directory pruning must not delete, traverse destructively into, or treat root `.backup/**` as removable managed output.

### Shared Audit Snapshot

Backup and uninstall continue to consume one reviewed audit snapshot.

`make-docs uninstall --backup` creates the backup under `.make-docs/backup/**` before deletion and deletes only paths approved by the same reviewed audit snapshot.

Both `.make-docs/backup/**` and root `.backup/**` are protected from recursive backup or uninstall damage.

### Selected-Agentics Directory Pruning

After selected-agentics removal, audit/uninstall must prune empty managed parent directories under `.make-docs/agentics/**` when no unmanaged descendants remain.

The pruning rule applies to project-scoped and home-scoped selected-agentics state.

The pruning rule may remove empty managed `skills/<skill-name>/`, `skills/`, and `agentics/` directories after selected skill payload removal, but it must preserve:

- sibling selected skills or plugins;
- `manifests/` or equivalent metadata records that remain in use;
- user-authored files;
- modified managed files;
- wrong-target symlinks;
- ambiguous missing-manifest state;
- legacy generated stubs or copy mirrors that require review;
- any future selected-agentics content not approved by the same audit snapshot.

Lifecycle code must unlink symlink exposures without following targets and must remove managed copy mirrors only when they are classified as clean.

### Downstream Plugin Inheritance

Plugin lifecycle work inherits this backup and pruning contract.

Selected plugin payload backup, uninstall, migration, and cleanup must use `.make-docs/backup/**`, protect legacy root `.backup/**`, and prune empty Make Docs-owned plugin or agentics directories only after audit proves there are no unmanaged descendants.

## Non-Requirements

- No automatic migration of root `.backup/**`.
- No deletion of root `.backup/**` during uninstall.
- No symlink-only selected-agentics behavior.
- No generated-stub default behavior.
- No remote skill delivery decision.
- No plugin selection or plugin runtime implementation.
- No MCP write implementation in this correction.

## Affected Baseline Docs

- [02 Architecture Overview](02-architecture-overview.md)
- [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md)
- [05 Installation Profile and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md)
- [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)

## Acceptance Criteria

- Fresh backup runs create `.make-docs/backup/<date>` and do not create root `.backup/**`.
- Same-day backup ordinals remain deterministic under `.make-docs/backup/**`.
- Existing root `.backup/**` is preserved through backup, audit, uninstall, and smoke-pack scenarios.
- `uninstall --backup` writes the backup under `.make-docs/backup/**` and then deletes only reviewed paths.
- Removing the only selected skill prunes empty managed `.make-docs/agentics/**` parent directories.
- Removing one selected skill does not prune sibling selected-skill or selected-plugin content.
- User-authored or ambiguous content under `.make-docs/agentics/**` is preserved or routed to review.
- Package smoke validation proves the packed CLI uses the corrected backup destination.

## Implementation Closeout

W17 R4 completed the CLI/package lifecycle correction on 2026-06-27.

Shipped behavior:

- New `make-docs backup` and `make-docs uninstall --backup` snapshots write under `.make-docs/backup/<date>` with existing same-day ordinal behavior preserved under the new root.
- Legacy root `.backup/**` is protected as recovery evidence and is ignored for new `.make-docs/backup/**` ordinal calculation.
- Audit and uninstall guardrails protect both `.make-docs/backup/**` and root `.backup/**` from removal or pruning.
- Selected-skill removal and uninstall prune empty managed `.make-docs/agentics/**` parent directories for project and home-scoped canonical payloads after the reviewed audit or manifest-owned removal plan proves no unmanaged descendants remain.
- Manifest-owned native exposure symlinks are removed as links when they point at the recorded canonical payload; managed copy mirrors are removed only when clean.
- User-authored, modified, ambiguous, wrong-target, or future agentics content remains preserved for review.

Validation completed:

- `npm test -w packages/cli -- --run tests/backup.test.ts tests/uninstall.test.ts tests/audit.test.ts tests/lifecycle.test.ts tests/install.test.ts tests/skill-catalog.test.ts --reporter=dot --silent`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- Isolated manual UAT for selected-skill install, `.make-docs/backup/**` creation, root `.backup/**` preservation, selected-skill removal pruning, and uninstall pruning.

Deferred or unchanged:

- Existing root `.backup/**` trees are not automatically migrated.
- Plugin lifecycle behavior remains downstream W18 R2 work and must consume this backup-state and pruning contract.
- MCP write behavior, remote skill delivery, and selected-plugin implementation are not part of this correction.

## Source Anchors

- [../designs/2026-06-27-lifecycle-backup-state-and-agentics-pruning-correction.md](../designs/2026-06-27-lifecycle-backup-state-and-agentics-pruning-correction.md)
- [../plans/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/00-overview.md](../plans/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/00-overview.md)
- [../work/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/00-index.md](../work/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/00-index.md)
- [05 Installation Profile and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md)
- [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)
- `packages/cli/src/backup.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/src/lifecycle-ui.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/tests/backup.test.ts`
- `packages/cli/tests/audit.test.ts`
- `packages/cli/tests/uninstall.test.ts`
- `packages/cli/tests/lifecycle.test.ts`
- `scripts/smoke-pack.mjs`
