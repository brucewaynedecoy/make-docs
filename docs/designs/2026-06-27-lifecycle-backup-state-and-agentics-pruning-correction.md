# Lifecycle Backup State and Agentics Pruning Correction

## Purpose

Correct the lifecycle state contract after W17 R3 so backups move under `.make-docs/backup/**`, legacy root `.backup/**` remains protected historical backup state, and selected-agentics uninstall can prune empty managed `.make-docs/agentics/**` directories without deleting user or unmanaged content.

## Context

W7 introduced the backup and uninstall lifecycle around a root `.backup/<date>` destination. That fit the first backup implementation, but later v2 work made `.make-docs/**` the Make Docs-owned tool directory for runtime state, system resources, manifests, conflicts, and selected-agentics payloads.

W17 R3 corrected shared-agentics exposure so selected skills are installed once under `.make-docs/agentics/skills/<skill-name>/` and exposed natively through harness skill roots by directory symlink when possible or managed copy mirror when symlink creation is unavailable. That correction leaves two lifecycle-state details unresolved:

- new backup writes still target root `.backup/**`, which creates another top-level Make Docs-managed state directory instead of routing state under `.make-docs/**`;
- uninstall can remove selected skill files but must also remove now-empty managed `.make-docs/agentics/**` parent directories when audit proves they have no unmanaged descendants.

The current repository and existing user installs may already contain root `.backup/**` directories. Those directories are backup evidence, not ordinary project docs, and cannot be deleted or migrated silently.

## Decision

Future backup writes use `.make-docs/backup/<date>` and retain the current deterministic same-day ordinal behavior under that new root.

Existing root `.backup/**` is legacy backup state. The CLI must protect and ignore it for audit/removal purposes, must not create new backup snapshots there, must not use it when calculating new `.make-docs/backup/**` ordinals, and must not delete it during uninstall. W17 R4 does not require automatic migration of existing root `.backup/**`; a later explicit migration may move it only through a reviewed plan.

Audit, backup, and uninstall protect both `.make-docs/backup/**` and legacy `.backup/**`. `make-docs uninstall --backup` creates the reviewed backup before deletion inside `.make-docs/backup/**` and then deletes only the paths approved by the same audit snapshot.

Selected-agentics uninstall removes audited Make Docs-owned canonical payloads and harness exposures, then prunes empty Make Docs-owned parent directories under `.make-docs/agentics/**` only when audit proves no unmanaged descendants remain. That includes project-scoped and home-scoped selected-agentics state. It must preserve non-empty directories, user-authored files, modified managed copy mirrors, wrong-target symlinks, ambiguous missing-manifest state, legacy generated stubs that need review, config or manifest state not selected for deletion, and any content outside the reviewed ownership set.

W17 R3 remains the native harness exposure authority. This correction does not reintroduce generated skill stubs, does not make symlink-only exposure mandatory, and does not change no-default-skills behavior.

## Alternatives Considered

Keeping root `.backup/**` as the future backup destination would avoid code churn but would keep a second top-level Make Docs-managed state surface after the tool-directory contract already moved product state into `.make-docs/**`.

Automatically migrating root `.backup/**` into `.make-docs/backup/**` would clean the tree but is too destructive for backup evidence. Backup folders may contain user-reviewed recovery material and should not move unless a dedicated reviewed migration explicitly chooses that behavior.

Treating root `.backup/**` as unmanaged ordinary project content would avoid special cases but would make uninstall and fallback audit more dangerous, because historical backup state could be traversed, backed up recursively, or proposed for deletion.

Leaving empty `.make-docs/agentics/**` directories after selected-skill removal would be conservative, but it leaves stale Make Docs-owned state behind and makes later audit or manual inspection harder. The safer target is prunable-only-when-empty-and-managed.

## Consequences

The implementation backlog must update backup planning, audit exclusions, uninstall guardrails, lifecycle UI output, CLI tests, and package smoke validation to use `.make-docs/backup/**` as the future destination while protecting legacy `.backup/**`.

The manifest path-normalization contract for home-scoped files remains unchanged: home-scoped paths still back up under `_home/**` inside the dated backup snapshot, now rooted at `.make-docs/backup/<date>`.

Existing installs that already received root `.backup/**` remain compatible. Fresh installs and new backup runs must not create root `.backup/**`.

W18 R2 plugin lifecycle work inherits this lifecycle-state correction before adding plugin payload backup, uninstall, or migration behavior.

## Design Lineage

- [Shared Agentics Native Harness Exposure Correction](./2026-06-27-shared-agentics-native-harness-exposure-correction.md)
- [Shared Agentics Installation and Harness Redirection](./2026-06-20-shared-agentics-installation-and-harness-redirection.md)
- [Tool Directory System and Custom Resource Tiers](./2026-06-19-tool-directory-system-and-custom-resource-tiers.md)
- [Compatibility Audit and Migration Disposition](./2026-06-19-compatibility-audit-and-migration-disposition.md)
- [CLI Help Backup and Uninstall](../assets/archive/designs/2026-04-18-cli-help-backup-and-uninstall.md)
- [Installation Profile and Manifest Lifecycle](../prd/05-installation-profile-and-manifest-lifecycle.md)
- [CLI Command Surface and Lifecycle](../prd/07-cli-command-surface-and-lifecycle.md)
- [Shared Agentics Installation Harness Redirection](../prd/28-shared-agentics-installation-and-harness-exposure.md)

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md)

Why: This correction changes active lifecycle and selected-agentics implementation requirements after W17 R3. It needs a generated plan, active PRD reconciliation, and executable work backlog before package code changes proceed.

Coordinate Handoff: Use W17 R4. W17 R3 remains completed native-exposure evidence; W17 R4 owns the follow-on lifecycle backup-state and agentics-pruning correction.
