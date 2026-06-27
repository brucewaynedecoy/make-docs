# Migration and Lifecycle Safety

## Purpose

Plan deterministic migration away from W17 R2 stubs without damaging user-authored harness skills.

## Planned Changes

- Detect clean manifest-owned W17 R2 generated stubs and replace them with symlink exposure or copy mirrors.
- Detect clean manifest-owned duplicated per-harness payloads and migrate them to canonical shared payload plus native exposure.
- Preserve modified stubs, modified copy mirrors, wrong-target symlinks, custom harness skill directories, malformed manifests, and ambiguous missing-manifest state for review.
- Update audit, backup, and uninstall to use `lstat`/link-aware behavior so symlink targets are not followed destructively.
- Ensure uninstall removes only reviewed Make Docs-owned exposure links or clean copy mirrors.

## Acceptance Criteria

- Clean W17 R2 stubs do not remain stale after sync/migration.
- Modified or custom local harness skills are preserved and surfaced for review.
- Backup and uninstall use one reviewed audit snapshot and never recursively delete through symlink targets.
- Non-interactive runs fail before unsafe mutation when required migration review cannot be completed.
