# Native Exposure Implementation

## Purpose

Plan the package-code changes needed to expose selected skills as native harness skill directories.

## Planned Changes

- Replace generated harness-stub production in selected skill planning with exposure planning records.
- Add symlink exposure creation for harness-native skill directories.
- Add managed copy-mirror fallback that copies the full canonical skill payload when symlink creation is unavailable or disabled.
- Ensure harness-visible `SKILL.md` frontmatter remains the real skill metadata, not Make Docs installation metadata.
- Add manifest records for exposure mode, harness, scope, link target, copy-mirror source, and legacy stub status.
- Update dry-run and skills UI output to distinguish canonical payloads, symlink exposures, copy mirrors, legacy stubs, and migrated duplicated payloads.

## Acceptance Criteria

- Project-scope and global-scope selected skills expose full native skill trees to enabled harnesses.
- Symlink exposure is preferred where available.
- Copy-mirror fallback exposes the same full skill tree and is tracked as a managed mirror, not an authoritative duplicate.
- Generated stubs are not produced by default.
